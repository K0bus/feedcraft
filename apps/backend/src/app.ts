import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import sensible from '@fastify/sensible';
import healthRoutes from './routes/health.js';
import authRoutes from './routes/auth.js';
import gameRoutes from './routes/games.js';
import subscriptionRoutes from './routes/subscriptions.js';
import newsRoutes from './routes/news.js';
import adminRoutes from './routes/admin.js';

export function buildApp() {
  const app = Fastify({
    logger: true
  });

  // Plugins
  app.register(cors, {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  });
  app.register(cookie);
  app.register(jwt, {
    secret: process.env.JWT_SECRET || 'super_secret_jwt_key_change_me_in_production'
  });
  app.register(sensible);

  // Register Routes
  app.register(healthRoutes, { prefix: '/api/health' });
  app.register(authRoutes, { prefix: '/api/auth' });
  app.register(gameRoutes, { prefix: '/api/games' });
  app.register(subscriptionRoutes, { prefix: '/api/subscriptions' });
  app.register(newsRoutes, { prefix: '/api/news' });
  app.register(adminRoutes, { prefix: '/api/admin' });

  return app;
}
