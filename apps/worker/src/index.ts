import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../../.env'), override: true });
dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: true });

import cron from 'node-cron';
import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import { translateAndSummarizeNews } from './services/gemini.js';
import { fetchLatestRawNews } from './services/newsFetcher.js';
import { db } from '@feedcrafter/database';
import { DispatchDiscordWebhookJobData } from '@feedcrafter/shared';

// Redis Connection
const redisConnection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null
});

// Queues Setup
export const newsFetchQueue = new Queue('news-fetch-queue', { connection: redisConnection });
export const discordDispatchQueue = new Queue('discord-dispatch-queue', { connection: redisConnection });

console.log('🚀 Service Worker FeedCrafter démarré...');

/**
 * Main Routine: Check news for all games in database, translate with Gemini AI, and dispatch Discord Webhooks
 */
export async function runNewsCheckPipeline() {
  console.log('⏰ [Cron Pipeline] Vérification des actualités pour tous les jeux enregistrés...');
  try {
    const games = await db.game.findMany({
      include: {
        subscriptions: {
          where: { status: 'ACTIVE' }
        }
      }
    });

    console.log(`[Cron Pipeline] ${games.length} jeu(x) trouvé(s) en base de données.`);

    for (const game of games) {
      if (!game.subscriptions || game.subscriptions.length === 0) {
        console.log(`[Cron Pipeline] Aucun abonnement actif pour le jeu ${game.name}. Passage...`);
        continue;
      }

      console.log(`[Cron Pipeline] Récupération de la dernière actualité pour ${game.name}...`);
      const rawArticle = await fetchLatestRawNews({ steamAppId: game.steamAppId, name: game.name });

      // Check if article is already recorded in NewsFeed database
      let newsFeed = await db.newsFeed.findFirst({
        where: {
          gameId: game.id,
          url: rawArticle.url
        }
      });

      if (!newsFeed) {
        console.log(`[Cron Pipeline] Nouvelle actualité détectée pour ${game.name}: "${rawArticle.title}"`);
        newsFeed = await db.newsFeed.create({
          data: {
            gameId: game.id,
            title: rawArticle.title,
            content: rawArticle.content,
            url: rawArticle.url,
            source: 'STEAM',
            externalId: rawArticle.url,
            publishedAt: new Date(rawArticle.publishedAt)
          }
        });
      }

      // Translate via Gemini AI & Dispatch to all active Webhooks for this game
      for (const sub of game.subscriptions) {
        // Check if this news item or URL was already dispatched to this subscription
        const alreadyDispatched = await db.dispatchLog.findFirst({
          where: {
            subscriptionId: sub.id,
            OR: [
              { newsFeedId: newsFeed.id },
              { newsFeed: { url: rawArticle.url } }
            ]
          }
        });

        if (alreadyDispatched) {
          console.log(`[Cron Pipeline] Actualité "${rawArticle.title}" déjà envoyée au webhook de l'abonnement ${sub.id}. Ignoré.`);
          continue;
        }

        console.log(`[Cron Pipeline] Traduction Gemini & Dispatch vers Webhook pour ${game.name} (Sub ID: ${sub.id})...`);
        const translation = await translateAndSummarizeNews(
          newsFeed.id,
          rawArticle.title,
          rawArticle.content,
          'fr'
        );

        // Record message dispatch in database (persisted to prevent re-sending on app restarts)
        await db.dispatchLog.upsert({
          where: {
            subscriptionId_newsFeedId: {
              subscriptionId: sub.id,
              newsFeedId: newsFeed.id
            }
          },
          update: {
            translatedTitle: translation.translatedTitle,
            translatedContent: translation.translatedContent,
            summary: translation.summary,
            status: 'SUCCESS'
          },
          create: {
            subscriptionId: sub.id,
            newsFeedId: newsFeed.id,
            translatedTitle: translation.translatedTitle,
            translatedContent: translation.translatedContent,
            summary: translation.summary,
            status: 'SUCCESS'
          }
        });

        await discordDispatchQueue.add('dispatch-webhook', {
          subscriptionId: sub.id,
          discordWebhookUrl: sub.discordWebhookUrl,
          translatedTitle: translation.translatedTitle,
          translatedContent: translation.translatedContent,
          summary: translation.summary,
          gameName: game.name,
          artworkUrl: game.artworkUrl || null,
          newsUrl: rawArticle.url,
          publishedAt: rawArticle.publishedAt
        });
      }
    }
  } catch (error) {
    console.error('[Cron Pipeline Error]', error);
  }
}

// 1. Cron Scheduler: Trigger news checking every 15 minutes
cron.schedule('*/15 * * * *', async () => {
  await runNewsCheckPipeline();
});

// 2. Worker: Discord Dispatcher Processor
const discordDispatchWorker = new Worker<DispatchDiscordWebhookJobData>(
  'discord-dispatch-queue',
  async (job) => {
    const { subscriptionId, discordWebhookUrl, translatedTitle, translatedContent, summary, gameName, artworkUrl, newsUrl, publishedAt } = job.data;
    console.log(`[Worker - Discord Dispatch] Dispatching webhook pour ${gameName} vers Discord...`);

    const payload: any = {
      embeds: [
        {
          title: `🎮 [${gameName}] ${translatedTitle}`,
          description: translatedContent || summary || 'Nouvelle mise à jour disponible !',
          url: newsUrl,
          color: 0x6366f1,
          thumbnail: artworkUrl ? { url: artworkUrl } : undefined,
          footer: {
            text: 'Propulsé par FeedCrafter'
          },
          timestamp: publishedAt ? new Date(publishedAt).toISOString() : new Date().toISOString()
        }
      ]
    };

    try {
      const response = await fetch(discordWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.status === 404) {
        console.warn(`[Worker - Discord Dispatch] Webhook introuvable (404). Désactivation de l'abonnement ${subscriptionId}`);
        await db.subscription.update({
          where: { id: subscriptionId },
          data: { status: 'INACTIVE' }
        });
      } else if (!response.ok) {
        throw new Error(`Erreur Webhook Discord ${response.status}: ${response.statusText}`);
      } else {
        console.log(`✅ [Worker - Discord Dispatch] Webhook livré avec succès sur Discord pour ${gameName} !`);
      }
    } catch (err: any) {
      console.error(`❌ [Worker - Discord Dispatch Error] Impossible de livrer le Webhook: ${err.message}`);
      throw err;
    }
  },
  { connection: redisConnection }
);

discordDispatchWorker.on('completed', (job) => {
  console.log(`🎉 [Worker - Discord Dispatch] Job ${job.id} achevé avec succès !`);
});

discordDispatchWorker.on('failed', (job, err) => {
  console.error(`❌ [Worker - Discord Dispatch] Job ${job?.id} a échoué:`, err);
});

// Initial execution at startup for testing
runNewsCheckPipeline();
