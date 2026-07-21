import { FastifyPluginAsync } from 'fastify';
import { db } from '@feedcrafter/database';
import { getPopularIGDBGames, searchIGDBGames, getIGDBGameDetails } from '../services/igdb.js';

const gameRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/games/popular - Get popular PC games from IGDB
  fastify.get('/popular', async (request, reply) => {
    try {
      const popularGames = await getPopularIGDBGames();
      return popularGames;
    } catch (err) {
      console.error('[Games Route Error] Failed to fetch popular games:', err);
      return reply.internalServerError('Erreur lors de la récupération des jeux populaires');
    }
  });

  // GET /api/games/search?query=... - Search IGDB catalogue
  fastify.get('/search', async (request, reply) => {
    const { query } = request.query as { query?: string };

    if (!query || query.trim().length === 0) {
      return getPopularIGDBGames();
    }

    try {
      const searchResults = await searchIGDBGames(query.trim());
      return searchResults;
    } catch (err) {
      console.error('[Games Route Error] Search failed:', err);
      return reply.internalServerError('Erreur lors de la recherche de jeux');
    }
  });

  // GET /api/games/:igdbId/details - Get comprehensive details & raw JSON from IGDB
  fastify.get('/:igdbId/details', async (request, reply) => {
    const { igdbId } = request.params as { igdbId: string };
    const { refresh } = request.query as { refresh?: string };
    const numericId = parseInt(igdbId, 10);
    if (isNaN(numericId)) {
      return reply.badRequest('ID IGDB invalide');
    }

    const shouldRefresh = refresh === 'true';

    try {
      const details = await getIGDBGameDetails(numericId);
      if (!details) {
        return reply.notFound('Jeu non trouvé sur IGDB');
      }

      // If refresh requested, update stored Game metadata in PostgreSQL database if it exists
      if (shouldRefresh && details.normalized) {
        const existingGame = await db.game.findUnique({ where: { igdbId: numericId } });
        if (existingGame) {
          await db.game.update({
            where: { igdbId: numericId },
            data: {
              name: details.normalized.name,
              coverUrl: details.normalized.coverUrl,
              steamAppId: details.normalized.steamAppId || null,
              epicSlug: details.normalized.epicSlug || null,
              bnetSlug: details.normalized.bnetSlug || null
            }
          });
        }
      }

      return details;
    } catch (err) {
      console.error('[Games Route Error] Details fetch failed:', err);
      return reply.internalServerError('Erreur lors de la récupération des détails IGDB');
    }
  });

  // GET /api/games - List saved games in local PostgreSQL DB
  fastify.get('/', async (_request, _reply) => {
    const games = await db.game.findMany({
      orderBy: { name: 'asc' }
    });
    return games;
  });
};

export default gameRoutes;
