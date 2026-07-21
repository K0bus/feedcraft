import { FastifyPluginAsync } from 'fastify';
import { db } from '@feedcrafter/database';
import { getPopularIGDBGames, searchIGDBGames } from '../services/igdb.js';

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

  // GET /api/games - List saved games in local PostgreSQL DB
  fastify.get('/', async (request, reply) => {
    const games = await db.game.findMany({
      orderBy: { name: 'asc' }
    });
    return games;
  });
};

export default gameRoutes;
