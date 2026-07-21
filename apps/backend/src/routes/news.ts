import { FastifyPluginAsync } from 'fastify';
import { db } from '@feedcrafter/database';
import { NewsPreviewRequest, NewsPreviewResponse } from '@feedcrafter/shared';
import { fetchLatestRawNews } from '../services/newsFetcher.js';
import { translateForDiscord } from '../services/geminiTranslator.js';
import { getIGDBGameDetails, fetchGameArtworkUrl } from '../services/igdb.js';

const newsRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /api/news/preview - Generate live news preview & Gemini translation
  fastify.post('/preview', async (request, reply) => {
    const body = (request.body || {}) as NewsPreviewRequest;

    let gameName = body.gameName || 'Jeu';
    let steamAppId = body.steamAppId || null;
    let artworkUrl: string | null = null;

    // Fetch game metadata from DB if gameId or igdbId is provided
    if (body.gameId) {
      const dbGame = await db.game.findUnique({ where: { id: body.gameId } });
      if (dbGame) {
        gameName = dbGame.name;
        steamAppId = dbGame.steamAppId || steamAppId;
        artworkUrl = dbGame.artworkUrl || null;
        if (!artworkUrl && dbGame.igdbId) {
          artworkUrl = await fetchGameArtworkUrl(dbGame.igdbId);
        }
      }
    } else if (body.igdbId) {
      const dbGame = await db.game.findUnique({ where: { igdbId: body.igdbId } });
      if (dbGame) {
        gameName = dbGame.name;
        steamAppId = dbGame.steamAppId || steamAppId;
        artworkUrl = dbGame.artworkUrl || null;
      }
      const details = await getIGDBGameDetails(body.igdbId);
      if (details?.normalized) {
        steamAppId = details.normalized.steamAppId || steamAppId;
        gameName = details.normalized.name || gameName;
        if (details.normalized.artworks && details.normalized.artworks.length > 0) {
          artworkUrl = details.normalized.artworks[0];
        }
      }
    }

    try {
      // 1. Fetch latest raw news article
      const rawArticle = await fetchLatestRawNews({ steamAppId, name: gameName });

      // 2. Translate with Gemini 2.5 Flash
      const translation = await translateForDiscord(rawArticle);

      // 3. Format response with raw, translated, and discordEmbed structures
      const response: NewsPreviewResponse = {
        raw: {
          title: rawArticle.title,
          content: rawArticle.content,
          url: rawArticle.url,
          publishedAt: rawArticle.publishedAt as string
        },
        translated: {
          title: translation.translatedTitle,
          content: translation.translatedContent,
          summary: translation.summary
        },
        discordEmbed: {
          title: translation.translatedTitle,
          description: translation.translatedContent,
          color: 0x6366f1, // Hex color for Discord Embed lateral bar (#6366F1)
          url: rawArticle.url,
          thumbnail: artworkUrl ? { url: artworkUrl } : undefined,
          footerText: 'Propulsé par FeedCrafter',
          timestamp: new Date(rawArticle.publishedAt).toISOString()
        }
      };

      return response;
    } catch (error) {
      console.error('[News Preview Error]', error);
      return reply.internalServerError('Erreur lors de la génération de la prévisualisation de l\'actualité.');
    }
  });
};

export default newsRoutes;
