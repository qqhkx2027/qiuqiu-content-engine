import fs from 'node:fs';
import path from 'node:path';
import { GHIBLI_CSS, GHIBLI_SKY, GHIBLI_FOOTER } from './theme.mjs';
import { ATOMS_EXTRA } from './theme_extra.mjs';
 const DATA = path.join(import.meta.dirname, '..', 'content/公众号/outputs/articles_data.json');
 const OUT = path.join(import.meta.dirname, '..', 'docs');
 const raw = JSON.parse(fs.readFileSync(DATA, 'utf8'));
 const cleang = raw.filter(a => a && a.title && a.date).map(a => ({
   filename: a.filename || '',
   title: (a.title || '').trim(),
   date: (a.date || '').slice(0, 10),
   account: (a.account || '').trim(),
   tags: (Array.isArray(a.tags) ? a.tags.map(t => t.trim()).filter(Boolean) : []).map(t => t.includes('/') ? t.split('/').pop() : t),
   content: (a.content_full || a.content_preview || '').replace(/\r/g, '').slice(0, 4200),
 }));
 const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
 const sentencesOf = t => t.split(/(?<=[。！？!?])/).flatMap(s => s.split(/\n/)).map(s => s.trim()).filter(s => s.length >= 10 && s.length <= 170);
 const TYPE_LABEL = { experience: '经历', method: '方法', case: '案例', quote: '金句', data: '数据', topic: '主题' };
 const TYPES = ['experience', 'method', 'case', 'quote', 'data'];
 function extractAtoms(a) {
   const out = [];
   for (const t of a.tags) {
     const tt = t.trim();
     if (tt && tt.length <= 12 && !out.some(x => x.type === 'topic' && x.text === tt)) out.push({ type: 'topic', text: tt });
   }
   const sents = sentencesOf(a.content).slice(0, 120);
   let ex = 0, me = 0, ca = 0, qu = 0, va = 0;
   const isM = s => /方法|步骤|教程|攻略|指南|原则|核心|关键|注意|建议|应该|一定|如何|怎么|使用|打开|选择|适合/.test(s);
   const isE = s => /我(?:的?[^。！？]{0,16}?)?(?:了|过|在|那年|当时)|我(?:和|跟|与)|我们/.test(s) && /大厂|裸辞|离职|考研|毕业|入职|搬家|旅居|带娃|体检|存钱|理财|读书|写作|拍摄|去过|住过|用过|做过|发现|觉得|开始|坚持|花了|赚到/.test(s);
   const isC = s => /比如|例如|举例|案例|像/.test(s) && s.length <= 110;
   const isQ = s => /[「『"]/.test(s) && s.length <= 90;
   const isV = s => /\d+(?:\.\d+)?\s*(?:万|亿|%|％|元|块|岁|小时|公里|天|篇|本|斤|次)/.test(s) && s.length <= 90;
   for (const s of sents) {
     if (out.length >= 70) break;
     if (isE(s) && ex < 4) { out.push({ type: 'experience', text: s.slice(0, 64) }); ex++; continue; }
     if (isC(s) && ca < 3) { out.push({ type: 'case', text: s.slice(0, 54) }); ca++; continue; }
     if (isM(s) && me < 4) { out.push({ type: 'method', text: s.slice(0, 34) }); me++; continue; }
     if (isV(s) && va < 4) { out.push({ type: 'data', text: s.slice(0, 40) }); va++; continue; }
     if (isQ(s) && qu < 4) { const m = s.match(/[「『"]([^」』"]{2,34})[」』"]/); if (m) { out.push({ type: 'quote', text: m[1].slice(0, 34) }); qu++; } }
   }
   return out;
 }
 const byType = { experience: 0, method: 0, case: 0, quote: 0, data: 0 };
 const topicMap = new Map();
 const rows = [];
 for (const a of cleang) {
   const atoms = extractAtoms(a);
   for (const at of atoms) {
     byType[at.type] = (byType[at.type] || 0) + 1;
     rows.push({ type: at.type, text: at.text, file: a.filename, date: a.date, title: a.title, account: a.account });
   }
   const recentFlag = Number(a.date.slice(0, 4)) >= 2024;
   for (const t of a.tags) {
     let x = topicMap.get(t);
     if (!x) { x = { name: t, count: 0, recent: 0, types: { experience: 0, method: 0, case: 0, quote: 0, data: 0 } }; topicMap.set(t, x); }
     x.count++;
     if (recentFlag) x.recent++;
     const artAtoms = atoms.filter(k => k.type !== 'topic');
     for (const at of artAtoms) x.types[at.type] = (x.types[at.type] || 0) + 1;
   }
 }
 const topics = [...topicMap.values()].filter(t => t.count >= 6).sort((a, b) => b.count - a.count);
 const total = Object.values(byType).reduce((s, n) => s + n, 0);
 fs.writeFileSync(path.join(OUT, 'content_atoms.json'), JSON.stringify({ total, byType, topics, atoms: rows }));
const CSS = GHIBLI_CSS + ATOMS_EXTRA;
const NAV = '<a href="index.html">首页</a><a href="topics.html">主题</a><a href="map.html">内容地图</a><a href="archive.html">全部文章</a><a href="search.html">搜索</a><a class="nav-hl" href="about.html">我是谁</a></nav>';
const HEADER = GHIBLI_SKY + '<header><div class="wrap"><a class="site-logo" href="index.html">秋秋很开心</a><a <nav>href="index.html">首页</a><a href="topics.html">主题</a><a href="map.html">内容地图</a><a href="archive.html">全部文章</a><a href="search.html">搜索</a><a class="nav-hl" href="about.html">我是谁</a></nav></div></header>';
const FOOTER = GHIBLI_FOOTER;
 const statHtml = TYPES.map(t => '<div class="card"><div class="n">' + (byType[t] || 0) + '</div><div class="l">' + TYPE_LABEL[t] + ' 原子</div></div>').join('') + '<div class="card"><div class="n">' + total + '</div><div class="l">原子总数</div></div>';
 const topicHtml = topics.map(t => {
   const maxT = Math.max(1, ...TYPES.map(k => t.types[k] || 0));
   const cols = TYPES.map(k => '<div class="col"><i style="height:' + Math.max(4, Math.round((t.types[k] || 0) / maxT * 46)) + 'px"></i><span>' + TYPE_LABEL[k] + ' ' + (t.types[k] || 0) + '</span></div>').join('');
   const miss = TYPES.filter(k => (t.types[k] || 0) === 0);
   const gap = miss.length
     ? '<div class="gap warn">完整性缺口：缺 <b>' + miss.map(k => TYPE_LABEL[k]).join('、') + '</b>，下一篇可优先补齐</div>'
     : '<div class="gap ok">覆盖完整，可深化或做系列</div>';
   return '<div class="topic"><h3>' + esc(t.name) + '</h3><div class="meta">' + t.count + ' 篇文章 · 近两年 ' + t.recent + ' 篇</div><div class="bars">' + cols + '</div>' + gap + '</div>';
 }).join('');
 const html = '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>内容原子 · 秋秋很开心</title><style>' + CSS + '</style></head><body>' + HEADER + '<main class="wrap"><div class="hero"><h1>内容原子</h1><p class="tagline">502 篇文章 → 可复用、可组合的内容原子</p><div class="stat">' + statHtml + '</div></div><h2 class="yhead">主题内容完整性</h2>' + topicHtml + '<div class="hint">内容原子由规则自动抽取（经历/方法/案例/金句/数据），用于评判每个主题「已说过什么、还缺什么」。</div></main>' + FOOTER + '</body></html>';
 fs.writeFileSync(path.join(OUT, 'atoms.html'), html);
 console.log('atoms total:', total, JSON.stringify(byType));
 console.log('topics:', topics.length);
 
