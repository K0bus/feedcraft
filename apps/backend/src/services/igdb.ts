import { GameDTO, IGDBRawGame, IGDBGameDetailsResponse } from '@feedcrafter/shared';

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

  let artworkUrl: string | undefined = undefined;
  if (game.artworks && game.artworks.length > 0) {
    let u = game.artworks[0].url;
    if (u) {
      if (u.startsWith('//')) u = `https:${u}`;
      artworkUrl = u.replace('/t_thumb/', '/t_720p/');
    }
  }

  let steamAppId: string | undefined = undefined;
  let epicSlug: string | undefined = undefined;
  let bnetSlug: string | undefined = undefined;
  let gogSlug: string | undefined = undefined;

  if (game.external_games) {
    for (const ext of game.external_games) {
      const source = ext.category ?? ext.external_game_source;
      const url = (ext.url || '').toLowerCase();
      const uid = ext.uid || '';

      // 1. Steam Check (Source 1 or URL steampowered.com)
      if (source === 1 || url.includes('steampowered.com')) {
        if (uid && /^\d+$/.test(uid)) {
          steamAppId = uid;
        } else {
          const match = url.match(/\/app\/(\d+)/);
          if (match) steamAppId = match[1];
        }
      }
      // 2. Epic Games Store Check (Source 26 or URL epicgames.com)
      else if (source === 26 || url.includes('epicgames.com')) {
        if (uid) {
          epicSlug = uid;
        } else {
          const match = url.match(/\/p\/([^\/\?]+)/);
          if (match) epicSlug = match[1];
        }
      }
      // 3. Battle.net / Blizzard Check (URL battle.net or blizzard.com)
      else if (url.includes('battle.net') || url.includes('blizzard.com')) {
        bnetSlug = uid || 'blizzard';
      }
      // 4. GOG Check (Source 5 or URL gog.com)
      else if (source === 5 || url.includes('gog.com')) {
        gogSlug = uid;
      }
    }
  }

  let platformName = 'rss';
  if (steamAppId) {
    platformName = 'steam';
  } else if (epicSlug) {
    platformName = 'epic';
  } else if (bnetSlug) {
    platformName = 'bnet';
  } else if (gogSlug) {
    platformName = 'gog';
  } else if (game.platforms && game.platforms.length > 0) {
    const p0 = game.platforms[0].name.toLowerCase();
    if (p0.includes('steam')) platformName = 'steam';
    else if (p0.includes('epic')) platformName = 'epic';
    else if (p0.includes('battle.net') || p0.includes('blizzard') || p0.includes('bnet')) platformName = 'bnet';
    else if (p0.includes('gog')) platformName = 'gog';
    else platformName = game.platforms[0].name;
  }

  return {
    igdbId: game.id,
    name: game.name,
    summary: game.summary || null,
    coverUrl,
    artworkUrl: artworkUrl || null,
    steamAppId: steamAppId || null,
    epicSlug: epicSlug || null,
    bnetSlug: bnetSlug || null,
    platform: platformName
  };
}

/**
 * Helper to fetch the first artwork URL for a game from IGDB API
 */
export async function fetchGameArtworkUrl(igdbId: number): Promise<string | null> {
  try {
    const details = await getIGDBGameDetails(igdbId);
    if (details?.normalized?.artworks && details.normalized.artworks.length > 0) {
      return details.normalized.artworks[0];
    }
  } catch (err) {
    console.warn(`[IGDB Service] Failed to fetch artwork for IGDB ID ${igdbId}:`, err);
  }
  return null;
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
    fields name, summary, cover.url, external_games.category, external_games.external_game_source, external_games.uid, external_games.url, platforms.name;
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
    fields name, summary, cover.url, external_games.category, external_games.external_game_source, external_games.uid, external_games.url, platforms.name, follows;
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

/**
 * Fetches comprehensive metadata for a specific game by IGDB ID, including raw JSON.
 */
export async function getIGDBGameDetails(igdbId: number): Promise<IGDBGameDetailsResponse | null> {
  const token = await getTwitchAccessToken();
  const clientId = process.env.TWITCH_CLIENT_ID || '';

  if (!token || !clientId) {
    return null;
  }

  const bodyQuery = `
    fields name, summary, storyline, cover.url, artworks.url, screenshots.url, first_release_date, rating, aggregated_rating, follows, genres.name, game_modes.name, themes.name, platforms.name, involved_companies.company.name, involved_companies.developer, involved_companies.publisher, external_games.category, external_games.external_game_source, external_games.uid, external_games.url, url;
    where id = ${igdbId};
    limit 1;
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
    console.error(`[IGDB Details Error] ${response.status} ${response.statusText}`);
    return null;
  }

  const rawGames = (await response.json()) as IGDBRawGame[];
  if (!rawGames || rawGames.length === 0) return null;

  const raw = rawGames[0];
  const normalizedBase = normalizeIGDBGame(raw);

  const developers = raw.involved_companies?.filter(c => c.developer).map(c => c.company?.name).filter(Boolean) as string[] || [];
  const publishers = raw.involved_companies?.filter(c => c.publisher).map(c => c.company?.name).filter(Boolean) as string[] || [];

  const externalLinks: Array<{ category: string; name: string; url: string }> = [];
  if (normalizedBase.steamAppId) {
    externalLinks.push({ category: 'steam', name: 'Steam Store', url: `https://store.steampowered.com/app/${normalizedBase.steamAppId}` });
  }
  if (normalizedBase.epicSlug) {
    externalLinks.push({ category: 'epic', name: 'Epic Games Store', url: `https://store.epicgames.com/fr/p/${normalizedBase.epicSlug}` });
  }
  if (normalizedBase.bnetSlug) {
    externalLinks.push({ category: 'bnet', name: 'Battle.net Store', url: `https://news.blizzard.com` });
  }
  if (raw.url) {
    externalLinks.push({ category: 'igdb', name: 'Fiche IGDB.com', url: raw.url });
  }

  const artworks = raw.artworks?.map(a => {
    let u = a.url;
    if (u.startsWith('//')) u = `https:${u}`;
    return u.replace('/t_thumb/', '/t_720p/');
  }) || [];

  const screenshots = raw.screenshots?.map(s => {
    let u = s.url;
    if (u.startsWith('//')) u = `https:${u}`;
    return u.replace('/t_thumb/', '/t_720p/');
  }) || [];

  const releaseDateStr = raw.first_release_date
    ? new Date(raw.first_release_date * 1000).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  return {
    normalized: {
      ...normalizedBase,
      storyline: raw.storyline || null,
      firstReleaseDate: releaseDateStr,
      rating: raw.rating ? Math.round(raw.rating) : null,
      aggregatedRating: raw.aggregated_rating ? Math.round(raw.aggregated_rating) : null,
      follows: raw.follows || null,
      genres: raw.genres?.map(g => g.name) || [],
      gameModes: raw.game_modes?.map(gm => gm.name) || [],
      themes: raw.themes?.map(t => t.name) || [],
      developers,
      publishers,
      igdbUrl: raw.url || null,
      artworks,
      screenshots,
      externalLinks
    },
    raw
  };
}
