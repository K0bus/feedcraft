import Parser from 'rss-parser';
const parser = new Parser();

async function test() {
  const appId = '1604030'; // V Rising App ID mentioned by user
  const rssUrl = `https://store.steampowered.com/feeds/news/app/${appId}`;
  console.log('Fetching RSS from:', rssUrl);
  
  try {
    const feed = await parser.parseURL(rssUrl);
    if (feed.items && feed.items.length > 0) {
      const item = feed.items[0];
      console.log('Item Title:', item.title);
      console.log('Item link (raw):', item.link, 'type:', typeof item.link);
      console.log('Item guid (raw):', item.guid, 'type:', typeof item.guid);
      console.log('Item keys:', Object.keys(item));
    }
  } catch (err) {
    console.error('RSS error:', err);
  }
}

test();
