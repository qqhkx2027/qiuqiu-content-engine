// fetch_weread_direct.mjs - 微信读书官方 Cookie 直连，替代 wewe-rss 转发（参考 obsidian-weread-plugin）
// 用法: WEREAD_COOKIE="wr_vid=...; wr_skey=..." node site/fetch_weread_direct.mjs
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const COOKIE = process.env.WEREAD_COOKIE || '';
const MAX = Number(process.env.MAX_PER_RUN || 20);
const CONTENT = path.join(ROOT, 'content', '公众号');
const BASE = 'https://weread.qq.com';

const KNOWN_AUTHORS = ['秋秋很开心', '秋秋在分享'];

const folderOf = (title, author) => {
  const a = String(author || '').trim();
  if (a.includes('分享') || a.includes('秋秋在分享') || String(title || '').includes('在分享')) {
    return '《秋秋在分享》';
  }
  return '《秋秋很开心》';
};

async function getJson(url) {
  const r = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
      Cookie: COOKIE,
      Accept: 'application/json, text/plain, */*'
    }
  });
  if (r.status === 401) {
    console.error('登录态无效（HTTP 401）。Cookie 必须包含 wr_vid 和 wr_skey 两个登录字段。');
    console.error('获取方法：Chrome 打开 https://weread.qq.com 扫码登录 → F12 → Application → Cookies → weread.qq.com，展开每一行复制 Name=Value 拼成 "a=b; c=d" 格式，含 HttpOnly 的 wr_skey 也要复制。');
    throw new Error('HTTP 401 (cookie invalid)');
  }
  if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + url);
  return r.json();
}

async function fetchArticle(mpUrl) {
  const r = await fetch(mpUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.40'
    }
  });
  if (!r.ok) return null;
  const html = await r.text();
  const m = html.match(/<div[^>]+id="js_content"[^>]*>([\s\S]*?)<\/div>/);
  if (!m) return null;
  const body = m[1]
    .replace(/<img[^>]+data-src="([^"]+)"[^>]*>/gi, '![]($1)')
    .replace(/<img[^>]+src="([^"]+)"[^>]*>/gi, '![]($1)')
    .replace(/<p[^>]*>/gi, '\n\n').replace(/<\/p>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<section[^>]*>/gi, '\n\n').replace(/<\/section>/gi, '')
    .replace(/<h[1-6][^>]*>/gi, '\n\n## ').replace(/<\/h[1-6]>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n').trim();
  return {
    title: String((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1] || '').replace(/<[^>]+>/g, '').trim(),
    body
  };
}

const known = new Set();
function collect(dir, set) {
  if (!fs.existsSync(dir)) return;
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) collect(p, set);
    else if (f.name.endsWith('.md')) {
      const t = fs.readFileSync(p, 'utf8');
      const m = t.match(/^source:\s*(.+)$/m);
      if (m) set.add(m[1].trim());
    }
  }
}
collect(path.join(CONTENT, '《秋秋很开心》'), known);
collect(path.join(CONTENT, '《秋秋在分享》'), known);

const dateOf = (sec) => {
  if (!sec) return null;
  const d = new Date(sec * 1000);
  const p = (n) => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
};

(async () => {
  if (!COOKIE) {
    console.error('请设置 WEREAD_COOKIE（微信读书 Cookie）');
    console.error('获取方法：Chrome 打开 https://weread.qq.com 登录后，F12 → Console 执行: document.cookie');
    console.error('把输出完整粘贴到 GitHub 仓库 Secrets 的 WEREAD_COOKIE');
    process.exit(1);
  }
  const shelf = await getJson(BASE + '/api/user/notebook');
  const books = Array.isArray(shelf) ? shelf : (shelf.books || []);
  const isDebug = process.env.DEBUG_BOOKS === '1';
  if (isDebug) {
    console.log('DEBUG 书架前20条：');
    for (const b of books.slice(0, 20)) {
      const book = b.book || {};
      console.log('  type=' + book.type, '| title=' + String(book.title || '').slice(0, 40), '| url=' + String(book.url || '').slice(0, 60));
    }
  }
  const candidates = books.filter((b) => {
  const book = b.book || {};
  const title = String(book.title || '');
  return book.type === 3 && KNOWN_AUTHORS.some((x) => title.includes(x));
  });

  console.log('书架文章数:', books.length, '匹配公众号数:', candidates.length);
  let added = 0;
  for (const nb of candidates) {
    if (added >= MAX) break;
    const book = nb.book || {};
    const title = String(book.title || '').trim();
    const link = String(book.url || '');
    if (!title || !/mp\.weixin\.qq\.com/.test(link) || known.has(link)) continue;
    const date = dateOf(book.publishTime || nb.sort);
    if (!date) continue;
    const art = await fetchArticle(link);
    if (!art) { console.log('跳过(抓取失败):', link); continue; }
    const folder = folderOf(art.title, title);
    const dir = path.join(CONTENT, folder);
    fs.mkdirSync(dir, { recursive: true });
    const fname = date.replace(/-/g, '') + '-' + title.replace(/[\\/:*?"<>|]/g, '').slice(0, 80) + '.md';
    const md = '---\ntitle: "' + title.replace(/"/g, '\\\"') + '"\nsource: ' + link + '\ndate: ' + date + '\n---\n\n' + art.body;
    fs.writeFileSync(path.join(dir, fname), md);
    known.add(link);
    added++;
    console.log('入库:', fname, '(' + folder + ')');
  }
  console.log('done. added =', added);
})().catch((e) => { console.error('失败:', e.message); process.exit(1); });
