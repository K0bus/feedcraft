import { FastifyRequest, FastifyReply } from 'fastify';
import { db } from '@feedcrafter/database';

export async function requireSuperAdmin(request: FastifyRequest, reply: FastifyReply) {
  const superAdminId = process.env.SUPER_ADMIN_DISCORD_ID;

  if (!superAdminId) {
    return reply.status(500).send({
      error: 'Configuration serveur incomplète : la variable SUPER_ADMIN_DISCORD_ID n\'est pas définie.'
    });
  }

  let token = request.cookies.feedcrafter_session;

  if (!token && request.headers.authorization) {
    const parts = request.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  }

  if (!token) {
    return reply.status(401).send({ error: 'Authentification requise.' });
  }

  try {
    const decoded = request.server.jwt.verify<{ userId: string; discordId?: string }>(token);
    let discordId = decoded.discordId;

    if (!discordId) {
      const user = await db.user.findUnique({
        where: { id: decoded.userId }
      });
      discordId = user?.discordId;
    }

    if (!discordId || discordId !== superAdminId) {
      return reply.status(403).send({ error: 'Accès refusé : privilèges Administrateur requis.' });
    }

    // Attach verified user to request
    (request as any).user = decoded;
  } catch {
    return reply.status(401).send({ error: 'Session invalide ou expirée.' });
  }
}
