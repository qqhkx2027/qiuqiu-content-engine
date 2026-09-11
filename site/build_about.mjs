import fs from 'node:fs';
import path from 'node:path';
import { GHIBLI_CSS, GHIBLI_SKY, GHIBLI_FOOTER } from './theme.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'docs');
const DATA = path.join(ROOT, 'content/公众号/outputs/articles_data.json');

const arts = JSON.parse(fs.readFileSync(DATA, 'utf8')).filter(a => a && a.title && a.date);
const total = arts.length;
const byYear = {};
for (const a of arts) { const y = (a.date || '').slice(0, 4); if (y) byYear[y] = (byYear[y] || 0) + 1; }
const years = Object.keys(byYear).sort();
const acc = {};
for (const a of arts) { const k = (a.account || '秋秋很开心').trim(); acc[k] = (acc[k] || 0) + 1; }
const accs = Object.keys(acc).sort();
const num = v => (Number.isFinite(Number(v)) ? Number(v) : 0);

// 真实标签词云（前 24，点击跳搜索）
const tagCount = {};
for (const a of arts) for (const t of (a.tags || [])) { const t2 = String(t).trim().split('/').pop(); if (t2) tagCount[t2] = (tagCount[t2] || 0) + 1; }
const topTags = Object.entries(tagCount).sort((x, y) => y[1] - x[1]).slice(0, 24);
const maxTag = topTags[0] ? topTags[0][1] : 1;
const wordsHtml = topTags.map(([w, n]) => '<a class="word" style="font-size:' + Math.round(12 + n / maxTag * 16) + 'px" href="search.html?q=' + encodeURIComponent(w) + '" title="' + n + ' 篇">' + w + '</a>').join('');

// 6 大研究主题
const topics = [
  ['财务自由', '不是为了躺平，而是为了拥有选择生活的自由', 'var(--amber)'],
  ['生活方式', '普通家庭怎么过得舒服又体面，是我一直在试的事', 'var(--moss)'],
  ['自我成长', '把心理学用在解剖自己，记录真实的改变', 'var(--plum)'],
  ['AI 与工具', '普通人的 AI 用法：让工具省时间，而不是炫技', 'var(--indigo)'],
  ['读书', '读过的书，变成用得上的思考和方法', 'var(--olive)'],
  ['好物分享', '认真用过、认真测评，才敢分享', 'var(--sand)'],
];
const topicsHtml = topics.map(t => '<div class="it"><span class="dot" style="background:' + t[2] + '"></span><div><div class="name">' + t[0] + '</div><div class="why">' + t[1] + '</div></div></div>').join('');

// 第一次认识我的 5 篇
const reads = [
  ['01', '认识我', '26岁，我打算正式退休了！', '整个内容宇宙的原点：普通人也能谈自由', '2022.06', 'https://mp.weixin.qq.com/s/se7lRTlnpzbPMXOqDGWP1g'],
  ['02', '我的选择', '小城市45-60万真的足够Fire(退休）耶！', '用真实询价算给你看：便宜不等于将就', '2022.07', 'https://mp.weixin.qq.com/s/Eevz9jGj-JLerisrbKZ39A'],
  ['03', '我的状态', '退休3个月，收入10万块。', '摊开现金流：存单利息+广告+分成', '2022.09', 'https://mp.weixin.qq.com/s/xtRGUi5GyMguFRsWXsE-_w'],
  ['04', '我的方法', '不上班三年，我是如何省钱/花钱的？', '独创时间自由=错峰套利', '2023.05', 'https://mp.weixin.qq.com/s/zAhsojID9ud2Z9LE1fvrzA'],
  ['05', '我现在在做什么', '退休3年，我的资产翻倍了', '300→600，金钱/身体/能力三重奏', '2026.01', 'https://mp.weixin.qq.com/s/ZpNhg8lFPtGwNy9YUW6EfQ'],
];
const readsHtml = reads.map(r => '<a class="read" href="' + r[5] + '" target="_blank" rel="noopener"><span class="no">' + r[0] + '</span><span class="tag">' + r[1] + '</span><span class="t">' + r[2] + '</span><span class="w">' + r[3] + '</span></a>').join('');

// 时间线
const tlData = [
  ['2018-2021', '效率工具期', '写App、笔记、工具测评，用内容记录普通人的成长。'],
  ['2022', '退休元年', '26岁带着250万宣布退休。第一次把「财务自由≠财富自由」讲清楚。'],
  ['2023', 'FIRE体系化', '财富篇/心态篇/未来篇，提出「有钱/好心态/对能力自信」。'],
  ['2024-2025', '全家FIRE', '生娃、家庭账本，发现一家人的自由比一个人难得多。'],
  ['2025.04-至今', '旅居中国', '结束7年北漂：威海→海南→大理，骑行800km。'],
];
const tlHtml = tlData.map(s => '<div class="tl"><div class="ty">' + s[0] + '</div><div class="tt">' + s[1] + '</div><div class="td">' + s[2] + '</div></div>').join('');

// 年度柱状图（证据块）
const maxN = Math.max(...years.map(y => byYear[y]));
const chartHtml = years.map(y => {
  const n = num(byYear[y]);
  const h = Math.round(n / num(maxN) * 120);
  return '<div class="c"><div class="cv">' + n + '</div><div class="bar" style="height:' + h + 'px" title="' + n + ' 篇"></div><div class="cy">' + y + '</div></div>';
}).join('');

const hero = '<div class="ab-hero"><div class="eyebrow"><span class="dot"></span>认识秋秋 · QIUQIU</div><h1>一个普通人的自由生活实验</h1><p class="sub">96年 · 24岁裸辞 · 26岁退休 · 带娃旅居中国</p><p class="quote">「我好像无法给出建议，我先给出经历。」</p><a class="btn" href="#story">从我的故事开始 ↓</a></div>';

const story = '<section id="story" class="ab-sec"><h2>我的轨迹</h2><div class="story-line">2018开始写作 <i></i> 北漂编导 <i></i> 24岁裸辞 <i></i> 26岁退休 <i></i> 30岁旅居中国</div><div class="accs">' + accs.map(a => '<div class="acc"><b>' + a + '</b><span>' + acc[a] + ' 篇</span></div>').join('') + '</div></section>';
const research = '<section class="sec"><h2>我在长期研究这 6 件事</h2><div class="topics">' + topicsHtml + '</div></section>';
const evidence = '<section class="sec"><h2>我一路写了什么</h2><div class="chart">' + chartHtml + '</div><div class="tls">' + tlHtml + '</div></section>';
const onboard = '<section class="sec"><h2>第一次认识我，从这 5 篇开始</h2><div class="reads">' + readsHtml + '</div></section>';
const explore = '<section class="sec"><h2>我反复谈论的词</h2><div class="cloud">' + wordsHtml + '</div><p class="hint2">点击任意词 → 去搜相关文章</p></section>';

const css = `
.ab-hero{padding:44px 0 30px}.ab-hero .eyebrow{font-size:12px;color:var(--terracotta);font-weight:700;letter-spacing:.1em;display:flex;align-items:center;gap:8px}.ab-hero .eyebrow .dot{width:7px;height:7px;border-radius:50%;background:var(--terracotta)}
.ab-hero h1{font-size:38px;color:var(--green-deep);margin:10px 0 8px;letter-spacing:.5px}.ab-hero .sub{font-size:16px;color:var(--ink);opacity:.85;margin-bottom:12px}
.ab-hero .quote{font-size:15px;color:var(--brown);font-style:italic;margin:10px 0 18px;padding-left:14px;border-left:3px solid var(--yellow)}
.ab-hero .btn{display:inline-block;margin-top:6px}
.ab-sec,.sec{padding:24px 0 8px}.sec h2{font-size:23px;color:var(--green-deep);margin:26px 0 14px;border-left:4px solid var(--terracotta);padding-left:12px}
.story-line{display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center;font-size:14px;color:var(--ink);background:var(--paper);border:1.5px solid var(--line);border-radius:16px;padding:16px 20px;margin:14px 0}.story-line i{width:6px;height:6px;border-radius:50%;background:var(--terracotta);display:inline-block}
.accs{display:flex;gap:12px;flex-wrap:wrap}.acc{background:var(--paper);border:1.5px solid var(--line);border-radius:14px;padding:10px 16px;display:flex;flex-direction:column;gap:2px;flex:1;min-width:150px}.acc b{color:var(--green-deep);font-size:15px}.acc span{color:var(--brown);font-size:12.5px}
.topics{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px;margin:14px 0}.topics .it{background:var(--paper);border:1.5px solid var(--line);border-radius:16px;padding:14px 16px;display:flex;gap:12px;align-items:flex-start;transition:.15s}.topics .it:hover{border-color:var(--green);transform:translateY(-2px)}.topics .dot{width:10px;height:10px;border-radius:50%;flex:none;margin-top:5px}.topics .name{font-weight:800;color:var(--ink);font-size:14.5px;margin-bottom:2px}.topics .why{color:var(--brown);font-size:12.5px;line-height:1.55}
.chart{display:flex;align-items:flex-end;gap:8px;background:var(--paper);border:1.5px solid var(--line);border-radius:16px;padding:18px 20px;height:190px;margin:14px 0}.chart .c{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;gap:4px}.chart .cv{font-size:10px;font-weight:700;color:var(--brown)}.chart .bar{width:72%;border-radius:6px 6px 2px 2px;background:linear-gradient(180deg,var(--yellow),var(--terracotta))}.chart .cy{font-size:10px;color:var(--brown);font-weight:600}
.tls{display:flex;gap:10px;flex-wrap:wrap;margin-top:8px}.tl{flex:1;min-width:190px;background:var(--paper);border:1.5px solid var(--line);border-radius:14px;padding:12px 15px}.tl .ty{font-size:11px;font-weight:800;color:var(--terracotta);letter-spacing:.04em}.tl .tt{font-size:14px;font-weight:800;color:var(--green-deep);margin:2px 0}.tl .td{font-size:12px;color:var(--brown);line-height:1.5}
.reads{display:flex;flex-direction:column;gap:8px}.read{display:flex;align-items:center;gap:12px;background:var(--paper);border:1.5px solid var(--line);border-radius:14px;padding:12px 16px;transition:.15s}.read:hover{border-color:var(--green);transform:translateX(3px)}.read .no{font-size:13px;font-weight:800;color:var(--terracotta);width:26px}.read .tag{font-size:10.5px;background:#f3efe2;color:var(--brown);border-radius:8px;padding:2px 8px;flex:none}.read .t{font-size:14px;font-weight:700;color:var(--ink);flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.read .w{font-size:12px;color:var(--brown);flex:none;max-width:38%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cloud{display:flex;flex-wrap:wrap;gap:8px 10px;background:var(--paper);border:1.5px solid var(--line);border-radius:16px;padding:18px 20px;margin:14px 0}.cloud .word{color:var(--green-deep);font-weight:700;line-height:1.2;transition:.15s}.cloud .word:hover{color:var(--terracotta);transform:translateY(-2px)}.hint2{font-size:12px;color:var(--brown);margin-top:10px}
@media(max-width:640px){.ab-hero h1{font-size:28px}.read .w{display:none}.topics{grid-template-columns:1fr}}
`;

const page = ['<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>认识秋秋 · 秋秋很开心</title><meta name="description" content="秋秋的个人主页：一个普通人的自由生活实验">',
  '<style>', GHIBLI_CSS, css, '</style>',
  '</head><body>', GHIBLI_SKY, '<header><div class="wrap"><a class="site-logo" href="index.html">秋秋很开心</a><nav><a href="index.html">首页</a><a href="topics.html">主题</a><a href="map.html">内容地图</a><a href="archive.html">全部文章</a><a href="search.html">搜索</a><a class="nav-hl" href="about.html">我是谁</a></nav></div></header>',
  '<main class="wrap">', hero, story, research, evidence, onboard, explore, '</main>', GHIBLI_FOOTER, '</body></html>'].join('');

fs.writeFileSync(path.join(OUT, 'about.html'), page);
console.log('about v2 built:', total, 'posts');
