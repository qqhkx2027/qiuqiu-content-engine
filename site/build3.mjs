import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const DATA = path.join(ROOT, 'content/公众号/outputs/articles_data.json');
const OUT = path.join(import.meta.dirname, '..', 'docs');
const SITE_NAME = '秋秋很开心';

const articles = JSON.parse(fs.readFileSync(DATA, 'utf8'));

const clean = articles
  .filter(a => a && a.title && a.date)
  .map(a => ({
    filename: a.filename || '',
    account: (a.account || '秋秋很开心').trim(),
    title: (a.title || '').trim(),
    date: (a.date || '').slice(0, 10),
    description: (a.description || '').trim(),
    tags: Array.isArray(a.tags) ? a.tags.map(t => t.trim()).filter(Boolean) : [],
    source: a.source || '',
    word_count: Number(a.word_count) || 0,
    content_full: a.content_full || a.content_preview || '',
  }))
  .sort((a, b) => (a.date < b.date ? 1 : -1));

// 从原始 md 补充完整正文（保留图片）
const mdByFile = new Map();
for (const dir of [path.join(ROOT, 'content/公众号/《秋秋很开心》'), path.join(ROOT, 'content/公众号/《秋秋在分享》')]) {
  for (const f of fs.readdirSync(dir)) {
    if (f.endsWith('.md')) mdByFile.set(f, path.join(dir, f));
  }
}
let mdLoaded = 0;
for (const a of clean) {
  const fp = mdByFile.get(a.filename);
  if (!fp) continue;
  const text = fs.readFileSync(fp, 'utf8');
  const m = text.match(/^---[\s\S]*?---\s*([\s\S]*)$/);
  if (m) {
    a.content_full = m[1].trim() || a.content_full;
    mdLoaded++;
  }
}
console.log('md loaded:', mdLoaded, '/', clean.length);

const byYear = {};
for (const a of clean) { const y = a.date.slice(0,4); (byYear[y] ||= []).push(a); }
const years = Object.keys(byYear).sort().reverse();

const esc = s => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
let slugN = 0; const slug = () => { slugN++; return '/post/' + String(slugN).padStart(4, '0') + '.html'; };

const CSS = `body{font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif;background:#faf5ec;color:#2b2620;margin:0;line-height:1.75;} .wrap{max-width:1080px;margin:0 auto;padding:0 28px;} a{color:inherit;text-decoration:none;} header{position:sticky;top:0;background:rgba(250,245,236,.9);backdrop-filter:blur(8px);border-bottom:1px solid #ebe1d2;z-index:10;} header .wrap{display:flex;justify-content:space-between;align-items:center;padding-top:12px;padding-bottom:12px;} .site-logo{font-weight:700;letter-spacing:.5px;color:#d2593a;} nav a{margin-left:18px;color:#6d6458;font-size:14px;} nav a:hover{color:#d2593a;} .hero{padding:64px 0 40px;text-align:center;} .hero h1{font-size:40px;margin:0 0 12px;color:#b8482c;} .tagline{color:#6d6458;font-size:17px;} .stats{margin-top:24px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap;} .stats span{background:#fffdf8;border:1px solid #e7dcc8;border-radius:99px;padding:6px 16px;font-size:14px;color:#6d6458;} .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:20px;padding-bottom:60px;} .card{background:#fffdf8;border:1px solid #e7e1d3;border-radius:16px;padding:20px;display:block;transition:transform .15s,box-shadow .15s;} .card:hover{transform:translateY(-2px);box-shadow:0 10px 30px rgba(80,60,30,.08);} .card-meta{display:flex;justify-content:space-between;font-size:13px;color:#9b9083;margin-bottom:8px;} .card h3{font-size:17px;margin:0 0 8px;line-height:1.5;} .card p{font-size:14px;color:#6d6458;margin:0 0 12px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;} .card .tags span{background:#f3ece0;border-radius:6px;padding:2px 8px;font-size:12px;color:#8a6f4f;margin-right:6px;} .year-head{font-size:20px;color:#b8482c;margin:44px 0 16px;border-bottom:1px solid #e7e1d3;padding-bottom:6px;} footer{text-align:center;color:#9b9083;font-size:13px;padding:32px 0 40px;border-top:1px solid #e7e1d3;} .post-title{font-size:30px;} .post-meta{color:#9b9083;font-size:14px;} .post-desc{color:#6d6458;font-size:15px;} .post-body{background:#fffdf8;border:1px solid #e7e1d3;border-radius:16px;padding:24px;margin:20px 0;} .post-body p{margin:0 0 14px;} .post-body img{max-width:100%;border-radius:10px;margin:8px 0;} .post-body blockquote{border-left:4px solid #d8c5a0;margin:0 0 14px;padding-left:12px;color:#6d6458;} .post-body h2,.post-body h3{color:#b8482c;} .back{color:#b8482c;font-size:14px;} .hero-actions{display:flex;gap:14px;justify-content:center;margin-top:28px;flex-wrap:wrap;} .hero-actions .btn{background:#b8482c;color:#fff;border-radius:99px;padding:10px 22px;font-size:14px;display:inline-block;transition:opacity .15s;} .hero-actions .btn:hover{opacity:.85;} .hero-actions .btn.outline{background:transparent;border:1px solid #b8482c;color:#b8482c;} .jump-banner{background:#fdf3e7;border:1px solid #f0d9c0;border-radius:14px;padding:18px 22px;margin:8px 0 20px;text-align:center;} .jump-banner p{margin:0 0 10px;color:#8a6f4f;font-size:14px;} .jump-banner .btn{background:#b8482c;color:#fff;border-radius:99px;padding:9px 20px;font-size:14px;display:inline-block;} .post-nav{display:flex;justify-content:space-between;gap:16px;margin:24px 0;} .post-nav-item{flex:1;font-size:14px;} .post-nav-item.right{text-align:right;} .post-nav a{color:#b8482c;} .post-nav span{color:#9b9083;} .post-footer{margin:20px 0 60px;} .post-footer a{background:#b8482c;color:#fff;border-radius:99px;padding:10px 20px;display:inline-block;} .linkout{color:#b8482c;text-decoration:underline;} @media(max-width:640px){.hero h1{font-size:30px;} .grid{grid-template-columns:1fr;}}`;
const headerBar = (base = '') => `<header><div class="wrap"><a class="site-logo" href="${base}index.html">${SITE_NAME}</a><nav><a href="${base}index.html">首页</a><a href="${base}topics.html">主题</a><a href="${base}map.html">内容地图</a><a href="${base}opportunity.html">选题机会</a><a href="${base}atoms.html">内容原子</a><a href="${base}archive.html">全部文章</a><a href="${base}about.html">关于</a></nav></div></header>`;
const footer = () => `<footer>© ${new Date().getFullYear()} ${SITE_NAME} · 公众号文章存档 · 全部内容为秋秋原创</footer>`;
const page = (title, content, desc = '秋秋的个人网站，' + clean.length + ' 篇公众号历史文章存档', base = '', redirect = '') => `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title><meta name="description" content="${desc}"><meta property="og:title" content="${title}"><meta property="og:description" content="${desc}"><meta property="og:type" content="website"><meta property="og:site_name" content="秋秋很开心">${redirect ? '<meta http-equiv="refresh" content="0;url=' + redirect + '">' : ''}<style>${CSS}</style></head><body>${headerBar(base)}<main class="wrap">${content}</main>${footer()}</body></html>`;
const hero = () => `<div class="hero"><h1>把人生写成一场公开实验</h1><p class="tagline">秋秋的个人网站 · ${clean.length} 篇公众号文章的完整存档</p><div class="stats"><span>${clean.length} 篇文章</span><span>${years.length} 年</span><span>全部原创</span></div><div class="hero-actions"><a class="btn" href="archive.html">阅读全部文章</a><a class="btn outline" href="about.html">认识秋秋</a></div></div>`;

// 行内 markdown 渲染（转义后补回强调/链接）
const inline = s => s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\[([^\]\n]+)\](https?:\/\/[^)\s]+)/g, '<a class="linkout" href="$2" target="_blank" rel="noopener">$1</a>');

const renderMD = md => {
  const htmlLines = [];
  for (const raw of (md || '').split(/\r?\n/)) {
    const t = raw.trim();
    if (!t || t === '---') continue;
    if (t.startsWith('# ')) htmlLines.push('<h3>' + esc(t.slice(2)) + '</h3>');
    else if (t.startsWith('## ')) htmlLines.push('<h3>' + esc(t.slice(3)) + '</h3>');
    else if (t.startsWith('### ')) htmlLines.push('<h4>' + esc(t.slice(4)) + '</h4>');
    else if (t.startsWith('![')) { const m = t.match(/!\[.*?\]\((.*?)\)/); htmlLines.push(m ? '<img loading="lazy" src="' + m[1] + '" alt="">' : ''); }
    else if (t.startsWith('>')) htmlLines.push('<blockquote>' + inline(esc(t.slice(1).trim())) + '</blockquote>');
    else if (t.startsWith('- ') || t.startsWith('* ')) htmlLines.push('<p>· ' + inline(esc(t.slice(2))) + '</p>');
    else htmlLines.push('<p>' + inline(esc(t)) + '</p>');
  }
  return htmlLines.join('\n');
};

fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(path.join(OUT, 'post'), { recursive: true });

for (const a of clean) a._url = slug();

const safeHref = a => a.source ? a.source : a._url;
const card = a => `<a class="card" href="${safeHref(a)}" target="_blank" rel="noopener"><div class="card-meta"><time>${a.date}</time><span class="acct">${esc(a.account)}</span></div><h3>${esc(a.title)}</h3><p>${esc(a.description.slice(0,90))}</p><div class="tags">${a.tags.slice(0,3).map(t=>'<span>'+esc(t.split('/').pop())+'</span>').join('')}</div></a>`;

for (const a of clean) {
  const jumpTip = a.source ? `<div class="jump-banner"><p>本文正在跳转到公众号原文…</p><a class="btn" href="${esc(a.source)}" target="_blank" rel="noopener">如果未自动跳转，请点击这里</a></div>` : '';
  const srcFooter = a.source ? `<div class="post-footer"><a href="${esc(a.source)}" target="_blank" rel="noopener">在公众号阅读原文</a></div>` : `<div class="post-footer"><span style="color:#9b9083;font-size:13px;">本文为站内原创存档，无公众号原文链接</span></div>`;
  const body = `<article class="post">${jumpTip}<a class="back" href="../index.html">← 返回首页</a><h1 class="post-title">${esc(a.title)}</h1><div class="post-meta"><time>${a.date}</time> · ${esc(a.account)} · ${a.word_count} 字 · 约${Math.max(1, Math.round(a.word_count / 400))} 分钟阅读</div><p class="post-desc">${esc(a.description)}</p><div class="post-body">${renderMD(a.content_full)}</div>${srcFooter}</article>`;
  fs.writeFileSync(path.join(OUT, a._url.replace(/^\//, '')), page(a.title + ' · ' + SITE_NAME, body, a.description, '../', a.source));
}
// 上一篇/下一篇（时间倒序，为相邻文章补充导航）
for (let i = 0; i < clean.length; i++) {
  const a = clean[i];
  const prev = i > 0 ? clean[i - 1] : null;
  const next = i < clean.length - 1 ? clean[i + 1] : null;
  const fn = path.join(OUT, a._url.replace(/^\//, ''));
  let h = fs.readFileSync(fn, 'utf8');
  const nav = `<nav class="post-nav"><div class="post-nav-item">${prev ? '<a href="' + prev._url.split('/').pop() + '">← ' + esc(prev.title) + '</a>' : '<span>已经是第一篇</span>'}</div><div class="post-nav-item right">${next ? '<a href="' + next._url.split('/').pop() + '">' + esc(next.title) + ' →</a>' : '<span>已经是最新一篇</span>'}</div></nav>`;
  h = h.replace('<div class="post-footer">', nav + '<div class="post-footer">');
  fs.writeFileSync(fn, h);
}
fs.writeFileSync(path.join(OUT, 'urls.json'), JSON.stringify(clean.map(a => ({ filename: a.filename, url: a._url }))));

const yearSections = years.map(y => `<h2 class="year-head">${y} 年 · ${byYear[y].length} 篇</h2><div class="grid">${byYear[y].map(card).join('')}</div>`).join('');
fs.writeFileSync(path.join(OUT, 'index.html'), page('秋秋的个人网站', hero() + yearSections));
fs.writeFileSync(path.join(OUT, 'archive.html'), page('全部文章 · ' + SITE_NAME, hero() + '<div class="grid">' + clean.map(card).join('') + '</div>'));
fs.writeFileSync(path.join(OUT, 'about.html'), page('关于 · ' + SITE_NAME, '<div class="hero"><h1>关于</h1><p class="tagline">这里是秋秋。公众号「秋秋很开心」「秋秋在分享」，用文字记录学习、读书、旅行和日子。</p></div>'));


// SEO: sitemap / robots / RSS
const baseUrl = 'https://qqhkx2027.github.io/qiuqiu-content-engine';
const sitemap = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${baseUrl}/</loc></url><url><loc>${baseUrl}/topics.html</loc></url><url><loc>${baseUrl}/map.html</loc></url><url><loc>${baseUrl}/opportunity.html</loc></url><url><loc>${baseUrl}/atoms.html</loc></url><url><loc>${baseUrl}/archive.html</loc></url><url><loc>${baseUrl}/about.html</loc></url>${clean.map(a => '<url><loc>' + baseUrl + a._url + '</loc></url>').join('')}</urlset>`;
fs.writeFileSync(path.join(OUT, 'sitemap.xml'), sitemap);
fs.writeFileSync(path.join(OUT, 'robots.txt'), 'User-agent: *\nAllow: /\nSitemap: ' + baseUrl + '/sitemap.xml\n');
const rssItems = clean.slice(0, 20).map(a => `<item><title>${esc(a.title)}</title><link>${baseUrl}${a._url}</link><description>${esc(a.description.slice(0, 200))}</description><pubDate>${new Date(a.date + 'T00:00:00Z').toUTCString()}</pubDate></item>`).join('');
const rss = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${SITE_NAME}</title><link>${baseUrl}/</link><description>秋秋的个人网站</description>${rssItems}</channel></rss>`;
fs.writeFileSync(path.join(OUT, 'rss.xml'), rss);

console.log('DONE', clean.length, 'posts');
