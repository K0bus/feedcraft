import Parser from 'rss-parser';
import { RawArticle } from '@feedcrafter/shared';

const parser = new Parser();

const KNOWN_STEAM_APP_IDS: Record<string, string> = {
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

function cleanUrl(rawUrl: any, steamAppId?: string | null): string {
  let strUrl = '';
  if (typeof rawUrl === 'string') {
    strUrl = rawUrl;
  } else if (rawUrl && typeof rawUrl === 'object') {
    strUrl = rawUrl._ || rawUrl.href || rawUrl.link || '';
  }

  if (!strUrl) {
    return steamAppId ? `https://store.steampowered.com/news/app/${steamAppId}` : 'https://store.steampowered.com';
  }

  let cleaned = strUrl.trim().replace(/^["']|["']$/g, '');
  if (cleaned.startsWith('//')) {
    cleaned = 'https:' + cleaned;
  }
  try {
    const parsed = new URL(cleaned);
    return parsed.toString();
  } catch (err) {
    return steamAppId ? `https://store.steampowered.com/news/app/${steamAppId}` : 'https://store.steampowered.com';
  }
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
 * Fetches latest raw news item for a game from Steam RSS or fallback
 */
export async function fetchLatestRawNews(game: {
  steamAppId?: string | null;
  name: string;
}): Promise<RawArticle> {
  const appId = game.steamAppId || KNOWN_STEAM_APP_IDS[game.name.toLowerCase().trim()] || null;

  if (appId) {
    const rssUrl = `https://store.steampowered.com/feeds/news/app/${appId}`;
    try {
      console.log(`[Worker NewsFetcher] Fetching Steam RSS feed from ${rssUrl}`);
      const feed = await parser.parseURL(rssUrl);

      if (feed.items && feed.items.length > 0) {
        const latest = feed.items[0];
        const rawContent = latest['content:encoded'] || latest.content || latest.contentSnippet || '';
        const rawLink = latest.link || latest.guid;

        const exactArticleUrl = cleanUrl(rawLink, appId);
        console.log(`[Worker NewsFetcher] Exact Steam Article URL extracted: ${exactArticleUrl}`);

        return {
          title: latest.title || `Patch note pour ${game.name}`,
          content: stripHtml(rawContent) || 'Aucun contenu détaillé fourni.',
          url: exactArticleUrl,
          publishedAt: latest.pubDate || new Date().toISOString(),
          author: latest.creator || 'Équipe de Développement'
        };
      }
    } catch (error) {
      console.warn(`[Worker NewsFetcher] Échec de la récupération du flux RSS Steam pour AppId ${appId}:`, error);
    }
  }

  return {
    title: `${game.name} - Note de mise à jour & équilibrage`,
    content: `Mise à jour d'équilibrage majeure pour ${game.name}.\n\n- Correctifs de bugs et optimisation des serveurs.\n- Ajustement des compétences et rééquilibrage de gameplay.`,
    url: cleanUrl(undefined, appId),
    publishedAt: new Date().toISOString(),
    author: 'Équipe Officielle'
  };
}
