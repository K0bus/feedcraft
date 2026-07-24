import { FastifyPluginAsync } from 'fastify';
import { db } from '@feedcrafter/database';
import { UserDTO } from '@feedcrafter/shared';

const authRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/auth/discord - Redirect to Discord OAuth2 page
  fastify.get('/discord', async (request, reply) => {
    const clientId = process.env.DISCORD_CLIENT_ID;
    const redirectUri = process.env.DISCORD_REDIRECT_URI || 'http://localhost:3000/api/auth/discord/callback';

    if (!clientId) {
      return reply.internalServerError('DISCORD_CLIENT_ID missing in environment');
    }

    const discordOAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=code&scope=identify%20email%20guilds`;

    return reply.redirect(discordOAuthUrl);
  });

  // GET /api/auth/discord/callback - OAuth2 Callback handling
  fastify.get('/discord/callback', async (request, reply) => {
    const { code } = request.query as { code?: string };
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    if (!code) {
      return reply.redirect(`${frontendUrl}/auth/login?error=missing_code`);
    }

    const clientId = process.env.DISCORD_CLIENT_ID || '';
    const clientSecret = process.env.DISCORD_CLIENT_SECRET || '';
    const redirectUri = process.env.DISCORD_REDIRECT_URI || 'http://localhost:3000/api/auth/discord/callback';

    try {
      // 1. Exchange authorization code for token
      const tokenResponse = await fetch('https://discord.com/api/v10/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri
        })
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('[Discord OAuth Error] Token exchange failed:', errorText);
        return reply.redirect(`${frontendUrl}/auth/login?error=token_exchange_failed`);
      }

      const tokenData = (await tokenResponse.json()) as { access_token: string };

      // 2. Fetch User Profile from Discord
      const userResponse = await fetch('https://discord.com/api/v10/users/@me', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      });

      if (!userResponse.ok) {
        return reply.redirect(`${frontendUrl}/auth/login?error=user_fetch_failed`);
      }

      const discordUser = (await userResponse.json()) as {
        id: string;
        username: string;
        discriminator?: string;
        avatar?: string;
        email?: string;
      };

      const avatarUrl = discordUser.avatar
        ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
        : `https://cdn.discordapp.com/embed/avatars/${Number(discordUser.id) % 5}.png`;

      // 3. Fetch User Guilds from Discord
      const guildsResponse = await fetch('https://discord.com/api/v10/users/@me/guilds', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      });

      let discordGuilds: any[] = [];
      if (guildsResponse.ok) {
        discordGuilds = (await guildsResponse.json()) as any[];
      } else {
        console.warn('[Discord OAuth Warning] Could not fetch user guilds:', await guildsResponse.text());
      }

      // 4. Upsert User in Prisma Database
      const user = await db.user.upsert({
        where: { discordId: discordUser.id },
        update: {
          username: discordUser.username,
          email: discordUser.email || null,
          avatar: avatarUrl
        },
        create: {
          discordId: discordUser.id,
          username: discordUser.username,
          email: discordUser.email || null,
          avatar: avatarUrl
        }
      });

      // 5. Upsert User Guilds
      if (discordGuilds.length > 0) {
        for (const g of discordGuilds) {
          const iconUrl = g.icon
            ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png`
            : null;

          await db.userGuild.upsert({
            where: {
              userId_guildId: {
                userId: user.id,
                guildId: g.id
              }
            },
            update: {
              name: g.name,
              icon: iconUrl,
              permissions: g.permissions ? String(g.permissions) : null,
              owner: Boolean(g.owner)
            },
            create: {
              userId: user.id,
              guildId: g.id,
              name: g.name,
              icon: iconUrl,
              permissions: g.permissions ? String(g.permissions) : null,
              owner: Boolean(g.owner)
            }
          });
        }
      }

      // 6. Generate Session JWT & Cookie
      const token = fastify.jwt.sign(
        { userId: user.id, discordId: user.discordId, username: user.username },
        { expiresIn: '7d' }
      );

      reply.setCookie('feedcrafter_session', token, {
        path: '/',
        httpOnly: true,
        secure: process.env.COOKIE_SECURE === 'true',
        sameSite: 'lax',
        maxAge: 7 * 24 * 3600 // 7 days
      });

      return reply.redirect(`${frontendUrl}/auth/callback?token=${encodeURIComponent(token)}`);
    } catch (error) {
      console.error('[Discord OAuth Callback Error]', error);
      return reply.redirect(`${frontendUrl}/auth/login?error=server_error`);
    }
  });

  // GET /api/auth/me - Return current user profile with guilds
  fastify.get('/me', async (request, reply) => {
    let token = request.cookies.feedcrafter_session;
    
    // Also check Authorization header
    if (!token && request.headers.authorization) {
      const parts = request.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        token = parts[1];
      }
    }

    if (!token) {
      return reply.status(401).send({ error: 'Non authentifié' });
    }

    try {
      const decoded = fastify.jwt.verify<{ userId: string }>(token);
      const user = await db.user.findUnique({
        where: { id: decoded.userId },
        include: { guilds: true }
      });

      if (!user) {
        return reply.status(401).send({ error: 'Utilisateur introuvable' });
      }

      const userDto: UserDTO = {
        id: user.id,
        discordId: user.discordId,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        createdAt: user.createdAt.toISOString(),
        isSuperAdmin: Boolean(process.env.SUPER_ADMIN_DISCORD_ID && user.discordId === process.env.SUPER_ADMIN_DISCORD_ID),
        guilds: (user.guilds || []).map((g) => ({
          id: g.id,
          guildId: g.guildId,
          name: g.name,
          icon: g.icon,
          owner: g.owner,
          permissions: g.permissions
        }))
      };

      return userDto;
    } catch {
      return reply.status(401).send({ error: 'Session invalide ou expirée' });
    }
  });

  // POST /api/auth/logout - Clear session
  fastify.post('/logout', async (request, reply) => {
    reply.clearCookie('feedcrafter_session', { path: '/' });
    return { success: true };
  });
};

export default authRoutes;
