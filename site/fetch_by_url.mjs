// fetch_by_url.mjs — 按 mp.weixin.qq.com 链接逐个抓取单篇公众号文章并转 Markdown 入库
// 场景：补抓历史 / 零星缺文（we-mp-rss 或官方直连没抓到、需手动补的篇目）
// 用法:
//   node site/fetch_by_url.mjs "https://mp.weixin.qq.com/s/xxx" ["https://mp.weixin.qq.com/s/yyy" ...]
// 特性:
//   - 标题取页面 <meta property="og:title">
//   - 发布时间取页面 createTime（真实发布日，非抓取日）
//   - 公众号归属由页面 data-nickname 判断，落到对应 ./content/公众号/<号名>/
//   - 已自动剥离 <script>/<style>，避免把微信反爬 JS 混进正文
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const CONTENT = path.join(ROOT, 'content', '公众号');
const urls = process.argv.slice(2).filter(u => /mp\.weixin\.qq\.com/.test(u));
if (!urls.length) { console.error('用法: node fetch_by_url.mjs <url1> <url2> ...'); process.exit(1); }

function htmlToMd(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<img[^>]+data-src="([^"]+)"[^>]*>/gi, '![]($1)')
    .replace(/<img[^>]+src="([^"]+)"[^>]*>/gi, '![]($1)')
    .replace(/<\/?p[^>]*>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?section[^>]*>/gi, '\n\n')
    .replace(/<\/?h[1-6][^>]*>/gi, '\n\n## ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n').trim();
}

// 判定公众号：正文里的数据-nickname 或 data-biz，或根据 URL 试抓页面判断
function folderOfHtml(html) {
  const m = html.match(/data-nickname="([^"]*秋秋[^"]*)"/);
  const nick = m ? m[1] : '';
  if (nick.includes('分享')) return '《秋秋在分享》';
  if (nick.includes('开心')) return '《秋秋很开心》';
  // fallback：正文特征词
  if (/财务自由|FIRE|投资|退休/.test(html)) return '《秋秋在分享》';
  return '《秋秋很开心》';
}

async function fetchRealDate(url) {
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const h = await r.text();
    // 微信发布时间的多种真实格式（按优先级）：
    //   create_time: '2026-09-18 12:36'
    //   createTime = "2026-09-18 12:36"
    //   ct = '1789706202'  （裸 ct，无 var 前缀）
    let dm1 = h.match(/create_time\s*:\s*["']([0-9]{4}-\d{2}-\d{2}[^"']*)["']/);
    if (dm1) return { date: dm1[1].slice(0, 10), html: h };
    dm1 = h.match(/createTime\s*=\s*["']([0-9]{4}-\d{2}-\d{2}[^"']*)["']/);
    if (dm1) return { date: dm1[1].slice(0, 10), html: h };
    const dct = h.match(/createTime\s*=\s*["']?([0-9]{7,12})["']?/) || h.match(/ct\s*=\s*['"]?([0-9]{7,12})['"]/);
    if (dct) { const d = new Date(Number(dct[1]) * 1000); return { date: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`, html: h }; }
    return { date: null, html: h };
  } catch (e) { return { date: null, html: '' }; }
}

(async () => {
  let added = 0, fail = 0;
  for (const url of urls) {
    const { date, html } = await fetchRealDate(url);
    if (!date) { console.log('跳过(抓取失败):', url.slice(0, 60)); fail++; continue; }
    const folder = folderOfHtml(html);
    // 微信文章标题在 meta og:title，不是 <h1>
    const title = (html.match(/<meta\b[^>]+property="og:title"[^>]+content="([^"]+)"/) || [])[1]
      || (html.match(/<h1[^>]*>([^<]+)<\/h1>/) || [])[1] || '';
    if (!title) { console.log('跳过(无标题):', url); fail++; continue; }
    const bodyMd = htmlToMd(html);
    if (!bodyMd.trim()) { console.log('跳过(无正文):', url); fail++; continue; }
    const dir = path.join(CONTENT, folder);
    fs.mkdirSync(dir, { recursive: true });
    const fname = date.replace(/-/g, '') + '-' + title.replace(/[\\/:*?"<>|]/g, '').slice(0, 80) + '.md';
    const md = `---\ntitle: "${title.replace(/"/g, '\\"')}"\nsource: ${url}\ndate: ${date}\n---\n\n${bodyMd}`;
    fs.writeFileSync(path.join(dir, fname), md);
    console.log('入库:', folder + '/' + fname);
    added++;
  }
  console.log(`done. added=${added} fail=${fail}`);
})().catch(e => { console.error('失败:', e.message); process.exit(1); });