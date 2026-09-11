import fs from 'node:fs';
import path from 'node:path';
import { GHIBLI_CSS, GHIBLI_SKY, GHIBLI_FOOTER } from './theme.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'docs');
const DATA = path.join(ROOT, 'content/公众号/outputs/articles_data.json');
const SRC = path.join(ROOT, 'content/公众号/outputs/personal-homepage/index.html');

const arts = JSON.parse(fs.readFileSync(DATA, 'utf8')).filter(a => a && a.title && a.date);
const total = arts.length;
const wcSum = arts.reduce((s, a) => s + (a.word_count || 0), 0);
const byYear = {};
for (const a of arts) { const y = (a.date || '').slice(0, 4); if (y) byYear[y] = (byYear[y] || 0) + 1; }
const n2026 = byYear['2026'] || 0;
const peakEntry = Object.entries(byYear).sort((x, y) => y[1] - x[1])[0];
const peakY = peakEntry ? peakEntry[0] : '';
const peakN = peakEntry ? peakEntry[1] : 0;

let h = fs.readFileSync(SRC, 'utf8');

const cssM = h.match(/<style>([\s\S]*?)<\/style>/);
const bodyM = h.match(/<body>([\s\S]*?)<\/body>/);
if (!cssM || !bodyM) throw new Error('reference structure missing');
const refCss = cssM[1];
let refBody = bodyM[1];

const banner = '<div class="about-band"><span>由真实文章生成</span> · 数据与文章一一对应</div>';
refBody = refBody.replace('<div class="page">', '<div class="page">' + banner);

refBody = refBody.replace(/501/g, String(total));
refBody = refBody.replace(/75\.7/g, (wcSum / 10000).toFixed(1));
refBody = refBody.replace(/\{y:'2026', n:\d+/g, "{y:'2026', n:" + n2026);
refBody = refBody.replace(/\{y:'2025', n:\d+/g, "{y:'2025', n:" + (byYear['2025'] || 0));

let refJs = '';
const jsM = h.match(/<script>([\s\S]*?)<\/script>/);
if (jsM) refJs = '<script>' + jsM[1].replace(/501/g, String(total)) + '<\/script>';

const page = ['<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>认识秋秋</title>',
  '<style>', GHIBLI_CSS, '\n', refCss, '\n/* 与站点衔接 */\n.about-banner{max-width:1404px;margin:-4px auto 6px;padding:0 24px;font-size:12.5px;color:var(--brown);}\n.about-banner span{font-weight:700;color:var(--green-deep)}\n</style>',
  '</head><body>', GHIBLI_SKY, '<header><div class="wrap"><a class="site-logo" href="index.html">秋秋很开心</a><nav><a href="index.html">首页</a><a href="topics.html">主题</a><a href="map.html">内容地图</a><a href="opportunity.html">选题机会</a><a href="atoms.html">内容原子</a><a href="archive.html">全部文章</a><a href="about.html">关于</a><a href="search.html">搜索</a></nav></div></header>',
  refBody, refJs, GHIBLI_FOOTER, '</body></html>'].join('');

fs.writeFileSync(path.join(OUT, 'about.html'), page);
console.log('about built:', total, 'posts,', (wcSum / 10000).toFixed(1) + 'w, 2026:', n2026, 'peak', peakY + ':' + peakN);
