// 探针：测微信读书官方接口中「搜索公众号/文章」的能力，Cookie 直连
const BASE = 'https://weread.qq.com';
const COOKIE = process.env.WEREAD_COOKIE || '';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120';

async function probe(name, path, method = 'GET') {
  try {
    const r = await fetch(BASE + path, {
      method,
      headers: { 'User-Agent': UA, Cookie: COOKIE, Accept: 'application/json, text/plain, */*', 'Content-Type': 'application/json' }
    });
    const t = await r.text();
    console.log('###', name, r.status, t.slice(0, 500).replace(/\n/g, ' '));
  } catch (e) {
    console.log('###', name, 'ERR', e.message);
  }
}

const kw = encodeURIComponent('秋秋很开心');
const kw2 = encodeURIComponent('秋秋在分享');
probe('search', '/web/search/global?keyword=' + kw + '&maxIdx=0&count=10');
probe('search_fenxiang', '/web/search/global?keyword=' + kw2 + '&maxIdx=0&count=10');
probe('search_scope2', '/web/search/global?keyword=' + kw + '&scope=2&maxIdx=0&count=10');
probe('search_scope4', '/web/search/global?keyword=' + kw + '&scope=4&maxIdx=0&count=10');
probe('shelf', '/api/user/notebook');
