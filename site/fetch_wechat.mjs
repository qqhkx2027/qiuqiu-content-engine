// fetch_wechat.mjs — 从 wewe-rss 服务器拉取公众号新文章并转 Markdown 入库
// 用法: WEWE_RSS_ORIGIN="http://1.2.3.4:4000" node site/fetch_wechat.mjs
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const ORIGIN = (process.env.WEWE_RSS_ORIGIN || '').replace(/\/$/, '');
const MAX = Number(process.env.MAX_PER_RUN || 20);
const CONTENT = path.join(ROOT, 'content', '公众号');

const folderOf = (author) => {
  const a = String(author || '').trim();
  if (a.includes('分享') || a.includes('秋秋在分享')) return '《秋秋在分享》';
  return '《秋秋很开心》';
};

async function getJson(url) {
  const r = await fetch(url, { headers: { 'User-Agent': 'qiuqiu-archiver/1.0' } });
  if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + url);
  return r.json();
}

async function fetchArticle(mpUrl) {
  const r = await fetch(mpUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.40' }
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

const dateOf = (s) => {
  const m = String(s || '').match(/(\d{4})-(\d{2})-(\d{2})/);
  return m ? m[1] + '-' + m[2] + '-' + m[3] : null;
};

(async () => {
  if (!ORIGIN) { console.error('请设置 WEWE_RSS_ORIGIN'); process.exit(1); }
  const items = await getJson(ORIGIN + '/feeds/all.json?limit=60');
  const arr = Array.isArray(items) ? items : (items.items || []);
  let added = 0;
  for (const it of arr) {
    if (added >= MAX) break;
    const link = it.link || it.url || '';
    if (!/mp\.weixin\.qq\.com/.test(link) || known.has(link)) continue;
    const date = dateOf(it.pubDate || it.date || it.updatedAt);
    if (!date) continue;
    const author = String(it.author || it.account || it.feedTitle || '');
    const title = String(it.title || '').replace(/<[^>]+>/g, '').trim();
    if (!title) continue;
    let bodyMd = '';
    if (it.content) {
      bodyMd = String(it.content)
        .replace(/<img[^>]+data-src="([^"]+)"[^>]*>/gi, '![]($1)')
        .replace(/<img[^>]+src="([^"]+)"[^>]*>/gi, '![]($1)')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
        .replace(/\n{3,}/g, '\n\n').trim();
    } else {
      const art = await fetchArticle(link);
      if (!art) { console.log('跳过(抓取失败):', link); continue; }
      bodyMd = art.body;
    }
    const folder = folderOf(author);
    const dir = path.join(CONTENT, folder);
    fs.mkdirSync(dir, { recursive: true });
    const fname = date.replace(/-/g, '') + '-' + title.replace(/[\\/:*?"<>|]/g, '').slice(0, 80) + '.md';
    const md = '---\ntitle: "' + title.replace(/"/g, '\\"') + '"\nsource: ' + link + '\ndate: ' + date + '\n---\n\n' + bodyMd;
    fs.writeFileSync(path.join(dir, fname), md);
    known.add(link);
    added++;
    console.log('入库:', fname, '(' + folder + ')');
  }
  console.log('done. added =', added);
})().catch(e => { console.error('失败:', e.message); process.exit(1); });
