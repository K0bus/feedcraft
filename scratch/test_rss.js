const Parser = require('rss-parser');
const parser = new Parser();

async function main() {
  const appId = '594650'; // Hunt Showdown
  const rssUrl = `https://store.steampowered.com/feeds/news/app/${appId}`;

  const feed = await parser.parseURL(rssUrl);
  const latest = feed.items[0];

  console.log('--- RSS PARSER OUTPUT ---');
  console.log('latest.link:', latest.link);
  console.log('latest.guid:', latest.guid);
  console.log('latest.title:', latest.title);
}

main();
