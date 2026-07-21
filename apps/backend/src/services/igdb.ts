import { GameDTO, IGDBRawGame } from '@feedcrafter/shared';

let cachedAccessToken: string | null = null;
let tokenExpiresAt: number = 0;

/**
 * Fetches or returns cached Twitch App Access Token for IGDB API requests.
 */
export async function getTwitchAccessToken(): Promise<string> {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.warn('[IGDB Service] TWITCH_CLIENT_ID or TWITCH_CLIENT_SECRET missing in environment.');
    return '';
  }

  // Return cached token if valid (with 60s buffer)
  if (cachedAccessToken && Date.now() < tokenExpiresAt - 60000) {
    return cachedAccessToken;
  }

  console.log('[IGDB Service] Refreshing Twitch OAuth2 App Access Token...');

  const tokenUrl = `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`;

  const response = await fetch(tokenUrl, { method: 'POST' });
  if (!response.ok) {
    throw new Error(`Failed to fetch Twitch token: ${response.statusText}`);
  }

  const data = (await response.json()) as { access_token: string; expires_in: number };
  cachedAccessToken = data.access_token;
  tokenExpiresAt = Date.now() + data.expires_in * 1000;

  return cachedAccessToken;
}

/**
 * Normalizes raw IGDB API response into FeedCrafter GameDTO objects.
 */
function normalizeIGDBGame(game: IGDBRawGame): GameDTO {
  let coverUrl = game.cover?.url;
  if (coverUrl) {
    if (coverUrl.startsWith('//')) {
      coverUrl = `https:${coverUrl}`;
    }
    // Upgrade image resolution to t_cover_big
    coverUrl = coverUrl.replace('/t_thumb/', '/t_cover_big/');
  } else {
    coverUrl = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80';
  }

  let steamAppId: string | undefined = undefined;
  let epicSlug: string | undefined = undefined;
  let bnetSlug: string | undefined = undefined;

  if (game.external_games) {
    for (const ext of game.external_games) {
      if (ext.category === 1) {
        // 1 = Steam
        steamAppId = ext.uid;
      } else if (ext.category === 11) {
        // 11 = Epic Games Store
        epicSlug = ext.uid;
      } else if (ext.category === 14 || ext.category === 36) {
        // Battle.net / GOG
        bnetSlug = ext.uid;
      }
    }
  }

  const platformName = game.platforms && game.platforms.length > 0 ? game.platforms[0].name : 'PC';

  return {
    igdbId: game.id,
    name: game.name,
    summary: game.summary || null,
    coverUrl,
    steamAppId: steamAppId || null,
    epicSlug: epicSlug || null,
    bnetSlug: bnetSlug || null,
    platform: platformName
  };
}

/**
 * Searches IGDB for games matching query.
 */
export async function searchIGDBGames(query: string): Promise<GameDTO[]> {
  const token = await getTwitchAccessToken();
  const clientId = process.env.TWITCH_CLIENT_ID || '';

  if (!token || !clientId) {
    return [];
  }

  const bodyQuery = `
    search "${query.replace(/"/g, '')}";
    fields name, summary, cover.url, external_games.category, external_games.uid, platforms.name;
    limit 20;
  `;

  const response = await fetch('https://api.igdb.com/v4/games', {
    method: 'POST',
    headers: {
      'Client-ID': clientId,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'text/plain'
    },
    body: bodyQuery
  });

  if (!response.ok) {
    console.error(`[IGDB Search Error] ${response.status} ${response.statusText}`);
    return [];
  }

  const rawGames = (await response.json()) as IGDBRawGame[];
  return rawGames.map(normalizeIGDBGame);
}

/**
 * Fetches popular PC games from IGDB for default catalogue feed.
 */
export async function getPopularIGDBGames(): Promise<GameDTO[]> {
  const token = await getTwitchAccessToken();
  const clientId = process.env.TWITCH_CLIENT_ID || '';

  if (!token || !clientId) {
    // Return mock fallback popular games if Twitch credentials not set yet
    return [
      {
        igdbId: 730,
        name: 'Counter-Strike 2',
        coverUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
        steamAppId: '730',
        platform: 'Steam'
      },
      {
        igdbId: 1091500,
        name: 'Cyberpunk 2077',
        coverUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=800&q=80',
        steamAppId: '1091500',
        platform: 'Steam'
      },
      {
        igdbId: 2162,
        name: 'World of Warcraft',
        coverUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80',
        bnetSlug: 'wow',
        platform: 'Battle.net'
      },
      {
        igdbId: 1905,
        name: 'Fortnite',
        coverUrl: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=80',
        epicSlug: 'fortnite',
        platform: 'Epic Games'
      }
    ];
  }

  const bodyQuery = `
    fields name, summary, cover.url, external_games.category, external_games.uid, platforms.name, follows;
    where cover != null & follows != null;
    sort follows desc;
    limit 20;
  `;

  const response = await fetch('https://api.igdb.com/v4/games', {
    method: 'POST',
    headers: {
      'Client-ID': clientId,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'text/plain'
    },
    body: bodyQuery
  });

  if (!response.ok) {
    console.error(`[IGDB Popular Error] ${response.status} ${response.statusText}`);
    return [];
  }

  const rawGames = (await response.json()) as IGDBRawGame[];
  return rawGames.map(normalizeIGDBGame);
}
