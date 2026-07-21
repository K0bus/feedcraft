import Parser from 'rss-parser';
import { RawArticle } from '@feedcrafter/shared';

const parser = new Parser();

const KNOWN_STEAM_APP_IDS: Record<string, string> = {
  'hunt: showdown 1896': '594650',
  'hunt: showdown': '594650',
  'hunt showdown 1896': '594650',
  'hunt showdown': '594650',
  'v rising': '1604030',
  'counter-strike 2': '730',
  'counter strike 2': '730',
  'cs2': '730',
  'cyberpunk 2077': '1091500',
  'valheim': '892970',
  'apex legends': '1172470',
  'rust': '252490',
  'palworld': '1623730',
  'helldivers 2': '553850',
  'dota 2': '570',
  'pubg': '578080',
  'elden ring': '1245620',
  'baldur\'s gate 3': '1086940'
};

function resolveSteamAppId(game: { steamAppId?: string | null; name: string }): string | null {
  if (game.steamAppId && /^\d+$/.test(game.steamAppId)) {
    return game.steamAppId;
  }

  const rawName = (game.name || '').toLowerCase().trim();
  if (KNOWN_STEAM_APP_IDS[rawName]) {
    return KNOWN_STEAM_APP_IDS[rawName];
  }

  const cleanName = rawName.replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
  for (const [key, id] of Object.entries(KNOWN_STEAM_APP_IDS)) {
    const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
    if (cleanName.includes(cleanKey) || cleanKey.includes(cleanName)) {
      return id;
    }
  }

  return null;
}

function cleanUrl(rawUrl: any, steamAppId?: string | null): string {
  let strUrl = '';
  if (typeof rawUrl === 'string') {
    strUrl = rawUrl;
  } else if (rawUrl && typeof rawUrl === 'object') {
    strUrl = rawUrl._ || rawUrl.href || rawUrl.link || '';
  }

  let cleaned = strUrl.trim().replace(/^["']|["']$/g, '');
  if (cleaned.startsWith('//')) {
    cleaned = 'https:' + cleaned;
  }

  if (cleaned) {
    try {
      const parsed = new URL(cleaned);
      return parsed.toString();
    } catch {
      // Fallback below
    }
  }

  return steamAppId
    ? `https://store.steampowered.com/news/app/${steamAppId}`
    : 'https://store.steampowered.com';
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

/**
 * Fetches the latest raw news item for a game from official sources (Steam RSS)
 */
export async function fetchLatestRawNews(game: {
  steamAppId?: string | null;
  name: string;
}): Promise<RawArticle> {
  const appId = resolveSteamAppId(game);

  if (!appId) {
    throw new Error(`ID Steam manquant pour "${game.name}". Impossible d'extraire les actualités.`);
  }

  const rssUrl = `https://store.steampowered.com/feeds/news/app/${appId}`;
  try {
    console.log(`[NewsFetcher] Fetching Steam RSS feed from ${rssUrl}`);
    const feed = await parser.parseURL(rssUrl);

    if (feed.items && feed.items.length > 0) {
      const latest = feed.items[0];
      const rawContent = latest['content:encoded'] || latest.content || latest.contentSnippet || '';
      const rawLink = latest.link || latest.guid || (latest as any).id;

      const exactArticleUrl = cleanUrl(rawLink, appId);
      console.log(`[NewsFetcher] Exact Steam Article URL extracted: ${exactArticleUrl}`);

      return {
        title: latest.title || `Patch note pour ${game.name}`,
        content: stripHtml(rawContent) || 'Aucun contenu détaillé fourni.',
        url: exactArticleUrl,
        publishedAt: latest.pubDate || latest.isoDate || new Date().toISOString(),
        author: latest.creator || 'Équipe de Développement'
      };
    } else {
      throw new Error(`Aucune actualité disponible sur Steam pour "${game.name}" (AppID: ${appId}).`);
    }
  } catch (error: any) {
    if (error.message?.includes('ID Steam manquant') || error.message?.includes('Aucune actualité')) {
      throw error;
    }
    console.warn(`[NewsFetcher] Échec de la récupération du flux RSS Steam pour AppId ${appId}:`, error);
    throw new Error(`Erreur lors de la récupération des actualités Steam pour "${game.name}" : ${error.message}`);
  }
}
