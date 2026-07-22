import { FastifyPluginAsync } from 'fastify';
import { db } from '@feedcrafter/database';
import { CreateSubscriptionPayload } from '@feedcrafter/shared';
import { fetchLatestRawNews } from '../services/newsFetcher.js';
import { translateForDiscord } from '../services/geminiTranslator.js';
import { fetchGameArtworkUrl } from '../services/igdb.js';

const subscriptionRoutes: FastifyPluginAsync = async (fastify) => {
  // Helper to get authenticated user ID from session cookie or Bearer token
  const getAuthUserId = (request: any): string | null => {
    let token = request.cookies.feedcrafter_session;
    if (!token && request.headers.authorization) {
      const parts = request.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        token = parts[1];
      }
    }
    if (!token) return null;
    try {
      const decoded = fastify.jwt.verify<{ userId: string }>(token);
      return decoded.userId;
    } catch {
      return null;
    }
  };

  // GET /api/subscriptions - Get subscriptions for current logged-in user
  fastify.get('/', async (request, _reply) => {
    const userId = getAuthUserId(request);

    // If no authenticated user, return all or filtered for guest demo
    const subscriptions = await db.subscription.findMany({
      where: userId ? { userId } : undefined,
      include: { game: true },
      orderBy: { createdAt: 'desc' }
    });

    return subscriptions;
  });

  // POST /api/subscriptions/test-webhook - Send a live test payload to Discord Webhook
  fastify.post('/test-webhook', async (request, reply) => {
    const { webhookUrl, gameName } = (request.body || {}) as { webhookUrl?: string; gameName?: string };

    if (!webhookUrl || !webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
      return reply.badRequest('URL du Webhook Discord invalide');
    }

    const payload = {
      embeds: [
        {
          title: `🧪 Test de Webhook - FeedCrafter`,
          description: `Félicitations ! Votre Webhook Discord est configuré et prêt à recevoir les actualités et patch notes traduits via IA pour **${gameName || 'vos jeux'}**.`,
          color: 0x6366f1,
          fields: [
            { name: 'Statut', value: '🟢 Opérationnel', inline: true },
            { name: 'Service', value: 'FeedCrafter Router', inline: true }
          ],
          footer: { text: 'Propulsé par FeedCrafter' },
          timestamp: new Date().toISOString()
        }
      ]
    };

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        return reply.status(400).send({
          error: `Échec d'envoi vers Discord (Status ${response.status} ${response.statusText})`
        });
      }

      return { success: true };
    } catch (err: any) {
      return reply.status(400).send({
        error: `Impossible de contacter Discord: ${err.message}`
      });
    }
  });

  // POST /api/subscriptions - Subscribe to an IGDB Game with Discord Webhook
  fastify.post('/', async (request, reply) => {
    let userId = getAuthUserId(request);

    // Fallback: if not logged in, fetch or create a demo user to allow quick testing
    if (!userId) {
      let demoUser = await db.user.findFirst();
      if (!demoUser) {
        demoUser = await db.user.create({
          data: {
            discordId: 'demo_user_123',
            username: 'DemoUser',
            email: 'demo@feedcrafter.local'
          }
        });
      }
      userId = demoUser.id;
    }

    const body = request.body as CreateSubscriptionPayload;

    if (!body.igdbId || !body.gameName || !body.discordWebhookUrl) {
      return reply.badRequest('Champs obligatoires manquants (igdbId, gameName, discordWebhookUrl)');
    }

    let artworkUrl = body.artworkUrl || null;
    if (!artworkUrl && body.igdbId) {
      artworkUrl = await fetchGameArtworkUrl(body.igdbId);
    }

    // 1. Upsert Game by igdbId
    const game = await db.game.upsert({
      where: { igdbId: body.igdbId },
      update: {
        name: body.gameName,
        coverUrl: body.coverUrl,
        artworkUrl: artworkUrl || undefined,
        steamAppId: body.steamAppId || null,
        epicSlug: body.epicSlug || null,
        bnetSlug: body.bnetSlug || null
      },
      create: {
        igdbId: body.igdbId,
        name: body.gameName,
        coverUrl: body.coverUrl,
        artworkUrl,
        steamAppId: body.steamAppId || null,
        epicSlug: body.epicSlug || null,
        bnetSlug: body.bnetSlug || null
      }
    });

    // 2. Upsert Subscription for user & game
    const subscription = await db.subscription.upsert({
      where: {
        userId_gameId: {
          userId,
          gameId: game.id
        }
      },
      update: {
        discordWebhookUrl: body.discordWebhookUrl,
        guildName: body.guildName || 'Serveur Discord',
        status: 'ACTIVE'
      },
      create: {
        userId,
        gameId: game.id,
        discordWebhookUrl: body.discordWebhookUrl,
        guildName: body.guildName || 'Serveur Discord',
        status: 'ACTIVE'
      },
      include: { game: true }
    });

    return reply.status(201).send(subscription);
  });

  // POST /api/subscriptions/:id/clear-cache - Clear dispatch logs and re-send latest news
  fastify.post('/:id/clear-cache', async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const subscription = await db.subscription.findUnique({
        where: { id },
        include: {
          game: {
            include: {
              newsFeeds: {
                orderBy: { publishedAt: 'desc' },
                take: 1
              }
            }
          }
        }
      });

      if (!subscription) {
        return reply.notFound('Abonnement introuvable');
      }

      // 1. Delete all dispatch logs for this subscription
      await db.dispatchLog.deleteMany({
        where: { subscriptionId: id }
      });

      // 2. Fetch latest raw news for this game
      if (!subscription.game) {
        return reply.badRequest('Jeu non associé à cet abonnement');
      }

      let artworkUrl: string | null = subscription.game.artworkUrl || null;
      if (!artworkUrl && subscription.game.igdbId) {
        artworkUrl = await fetchGameArtworkUrl(subscription.game.igdbId);
        if (artworkUrl) {
          await db.game.update({
            where: { id: subscription.game.id },
            data: { artworkUrl }
          });
        }
      }

      const rawArticle = await fetchLatestRawNews({
        steamAppId: subscription.game.steamAppId,
        name: subscription.game.name
      });

      // 3. Upsert news feed in database
      let newsFeed = await db.newsFeed.findFirst({
        where: { gameId: subscription.game.id, url: rawArticle.url }
      });

      if (!newsFeed) {
        newsFeed = await db.newsFeed.create({
          data: {
            gameId: subscription.game.id,
            title: rawArticle.title,
            content: rawArticle.content,
            url: rawArticle.url,
            source: 'STEAM',
            externalId: rawArticle.url,
            publishedAt: new Date(rawArticle.publishedAt)
          }
        });
      }

      // 4. Clear news cache for this newsFeed so Gemini translates fresh content
      await db.newsCache.deleteMany({
        where: { newsFeedId: newsFeed.id }
      });

      // 5. Translate via Gemini AI
      const translation = await translateForDiscord(rawArticle);
      const newsImageUrl = newsFeed.imageUrl || rawArticle.imageUrl || null;
      if (!newsFeed.imageUrl && rawArticle.imageUrl) {
        await db.newsFeed.update({
          where: { id: newsFeed.id },
          data: { imageUrl: rawArticle.imageUrl }
        });
      }

      // 6. Deliver embed directly to Discord Webhook
      const discordPayload: any = {
        embeds: [
          {
            title: `🎮 [${subscription.game.name}] ${translation.translatedTitle}`,
            description: translation.translatedContent || translation.summary || 'Nouvelle mise à jour disponible !',
            url: rawArticle.url,
            color: 0x6366f1,
            thumbnail: artworkUrl ? { url: artworkUrl } : undefined,
            image: newsImageUrl ? { url: newsImageUrl } : undefined,
            footer: { text: 'Propulsé par FeedCrafter (Re-dispatch après purge du cache)' },
            timestamp: rawArticle.publishedAt ? new Date(rawArticle.publishedAt).toISOString() : new Date().toISOString()
          }
        ]
      };

      const webhookRes = await fetch(subscription.discordWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(discordPayload)
      });

      if (!webhookRes.ok) {
        console.warn(`[ClearCache Warning] Envoi au Webhook Discord a échoué (Status ${webhookRes.status})`);
      }

      // 7. Record fresh dispatch log in database
      await db.dispatchLog.create({
        data: {
          subscriptionId: subscription.id,
          newsFeedId: newsFeed.id,
          translatedTitle: translation.translatedTitle,
          translatedContent: translation.translatedContent,
          summary: translation.summary,
          status: webhookRes.ok ? 'SUCCESS' : 'FAILED',
          errorMessage: webhookRes.ok ? null : `Status ${webhookRes.status}`
        }
      });

      return {
        success: true,
        message: `Cache réinitialisé avec succès ! La dernière actualité pour ${subscription.game.name} a été renvoyée sur votre salon Discord.`
      };
    } catch (err: any) {
      console.error('[ClearCache Error]', err);
      return reply.internalServerError(`Erreur lors de la réinitialisation du cache: ${err.message}`);
    }
  });

  // GET /api/subscriptions/logs - Return dispatch logs history
  fastify.get('/logs', async (request, _reply) => {
    const userId = getAuthUserId(request);

    const logs = await db.dispatchLog.findMany({
      where: userId ? { subscription: { userId } } : undefined,
      include: {
        subscription: {
          include: { game: true }
        },
        newsFeed: true
      },
      orderBy: { sentAt: 'desc' },
      take: 50
    });

    return logs;
  });

  // DELETE /api/subscriptions/:id - Remove subscription
  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      await db.subscription.delete({
        where: { id }
      });
      return { success: true };
    } catch {
      return reply.notFound('Abonnement introuvable');
    }
  });
};

export default subscriptionRoutes;
