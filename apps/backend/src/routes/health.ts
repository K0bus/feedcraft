import { FastifyPluginAsync } from 'fastify';
import { db } from '@feedcrafter/database';

const healthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', async (request, reply) => {
    try {
      // Test DB connection
      await db.$queryRaw`SELECT 1`;
      return { status: 'ok', timestamp: new Date().toISOString(), db: 'connected' };
    } catch (err) {
      reply.status(500);
      return { status: 'error', timestamp: new Date().toISOString(), db: 'disconnected' };
    }
  });
};

export default healthRoutes;
