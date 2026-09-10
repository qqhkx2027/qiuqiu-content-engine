import fs from 'node:fs';
import path from 'node:path';
const OUT = path.join(import.meta.dirname, '..', 'docs');
const URLS = JSON.parse(fs.readFileSync(path.join(OUT, 'urls.json'), 'utf8'));
const urlByFile = new Map(URLS.map(u => [u.filename, u.url]));
const ROOT_D = path.join(import.meta.dirname, '..', 'content/公众号/outputs/articles_data.json');
const articles = JSON.parse(fs.readFileSync(ROOT_D, 'utf8'));
const clean = articles
  .filter(a => a && a.title && a.date)
  .map(a => ({ ...a, _url: urlByFile.get(a.filename) || '', tags: Array.isArray(a.tags) ? a.tags.map(t => t.includes('/') ? t.split('/').pop() : t).filter(Boolean) : [] }))
  .sort((a, b) => (a.date < b.date ? 1 : -1));
const TOPICS = [
  { name: '生活方式', match: ['生活方式', '旅行', '情感'] },
  { name: '自我成长', match: ['自我成长', '方法教程', '经验分享', '个人复盘'] },
  { name: '读书', match: ['读书', '书单推荐'] },
  { name: 'AI 与工具', match: ['AI'] },
  { name: '好物分享', match: ['好物', '好物推荐'] },
  { name: '财务自由', match: ['理财', '搞钱', '存钱', '提前退休', '理财分析'] },
];
const esc = s => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const home = fs.readFileSync(path.join(OUT, 'index.html'), 'utf8');
const css = home.match(/<style>([\s\S]*?)<\/style>/)[1];
const skyMatch = home.match(/<div class="sky">[\s\S]*?<\/header>/);
const header = skyMatch ? skyMatch[0] : home.match(/<header>[\s\S]*?<\/header>/)[0];
const footer = home.match(/<footer>[\s\S]*?<\/footer>/)[0];
const hero = '<div class="hero"><h1>按主题浏览</h1><p class="tagline">换个方式，看秋秋写了什么</p></div>';
const missing = {};
const html = TOPICS.map(tp => {
  const posts = clean.filter(p => p.tags.some(t => tp.match.includes(t) || tp.match.some(m => t.includes(m))));
  const cards = posts.slice(0, 6).map(a => {
    if (!a._url) missing[a.filename] = 1;
    const href = a.source || (a._url ? a._url.replace(/^\//, '') : '#');
    return `<a class="card" href="${href}" target="_blank" rel="noopener"><div class="card-meta"><time>${a.date}</time><span class="acct">${esc(a.account)}</span></div><h3>${esc(a.title)}</h3><p>${esc((a.description||'').slice(0,90))}</p><div class="tags">${a.tags.slice(0,3).map(t=>'<span>'+esc(t)+'</span>').join('')}</div></a>`;
  }).join('');
  const more = posts.length > 6 ? `<p class="more-link"><a href="search.html?q=${encodeURIComponent(tp.match[0])}">查看全部 ${posts.length} 篇 →</a></p>` : '';
  return `<div class="year-head">${tp.name} · ${posts.length} 篇</div><div class="grid">${cards}</div>${more}`;
}).join('');
const out = `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>按主题 · 秋秋</title><style>${css}</style></head><body>${header}<main class="wrap">${hero}${html}</main>${footer}</body></html>`;
fs.writeFileSync(path.join(OUT, 'topics.html'), out);
console.log('topics done, missing urls:', Object.keys(missing).length);
