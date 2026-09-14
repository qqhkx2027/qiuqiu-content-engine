import fs from 'node:fs';
import path from 'node:path';
import { GHIBLI_CSS, GHIBLI_SKY, GHIBLI_FOOTER } from './theme.mjs';
import { INTEL_EXTRA } from './theme_extra.mjs';
const OUT = path.join(import.meta.dirname, '..', 'docs');
const DATA = path.join(import.meta.dirname, '..', 'content/公众号/outputs/articles_data.json');
const TAXONOMY = path.join(import.meta.dirname, '..', 'config/taxonomy.json');
// archive 权威链接映射：title → 公众号原文 URL（真实存在的文章；archive 卡链接直接 mp.weixin.qq.com）
const ARCHIVE_LINK = {};
try {
  const ah = fs.readFileSync(path.join(OUT, 'archive.html'), 'utf8');
  for (const m of ah.matchAll(/<a class="card" href="(https:\/\/mp\.weixin\.qq\.com\/[^"]+)"[^>]*>.*?<h3>([^<]+)<\/h3>/g)) {
      ARCHIVE_LINK[m[2].trim()] = m[1];
    }
} catch (e) { /* archive 缺失时不显示素材链接 */ }
const raw = JSON.parse(fs.readFileSync(DATA, 'utf8'));
const tax = JSON.parse(fs.readFileSync(TAXONOMY, 'utf8'));
const clean = raw
  .filter(a => a && a.title && a.date)
  .map(a => ({
    title: (a.title || '').trim(),
    date: (a.date || '').slice(0, 10),
    tags: (Array.isArray(a.tags) ? a.tags.map(t => t.trim()).filter(Boolean) : []).map(t => t.includes('/') ? t.split('/').pop() : t),
    ct: Array.isArray(a.content_type) ? a.content_type[0] : (a.content_type || ''),
    wc: Number(a.word_count) || 0,
    pillars: Array.isArray(a.pillars) ? a.pillars : [],
    preview: (a.content_preview || '').slice(0, 180),
    src: a.filename || a.source || a.title,
  }))
  .sort((a, b) => (a.date < b.date ? 1 : -1));
const esc = s => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
// 动态"现在"（不硬编码年月，每月自动滚动）
const NOW = new Date();
const Y = NOW.getFullYear(), M = NOW.getMonth() + 1;
const monthsAgo = d => { const y = Number(d.slice(0,4)), m = Number(d.slice(5,7)); return (Y - y) * 12 + (M - m); };
const tagCount = new Map(), tagRecent = new Map(), tagLatest = new Map(), tagFirst = new Map();
for (const a of clean) for (const t of a.tags) {
  tagCount.set(t, (tagCount.get(t) || 0) + 1);
  if (monthsAgo(a.date) <= 24) tagRecent.set(t, (tagRecent.get(t) || 0) + 1);
  const lt = tagLatest.get(t);
  if (!lt || a.date > lt) tagLatest.set(t, a.date);
  // label 首发年份：用于「多年后重写」机会
  if (!tagFirst.has(t) || a.date < tagFirst.get(t)) tagFirst.set(t, a.date);
}
const tagStats = [...tagCount.entries()]
  .map(([name, count]) => ({ name, count, recent: tagRecent.get(name) || 0, latest: tagLatest.get(name) || '', first: tagFirst.get(name) || '' }))
  .filter(t => t.count >= 4);
const opps = [];
// 1) 强深耕（近2年活跃 + 历史厚）
tagStats.filter(t => t.recent >= 8 && t.count >= 15)
  .sort((a,b)=> (b.recent*10 + b.count) - (a.recent*10 + a.count))
  .slice(0,5)
  .forEach(t => opps.push({ level:'go', name: t.name,
    title: '「'+t.name+'」是高频主题，继续做',
    reason: '近两年 '+t.recent+' 篇、历史共 '+t.count+' 篇（最新 '+t.latest+'）。可以往系列化做：合集、评测季、复盘。' }));
// 2) 交叉空白：各自多但很少一起出现
const tagPair = [];
for (let i = 0; i < tagStats.length; i++) for (let j = i+1; j < tagStats.length; j++) {
  const a = tagStats[i], b = tagStats[j];
  const both = clean.filter(x => x.tags.includes(a.name) && x.tags.includes(b.name)).length;
  if (a.count >= 10 && b.count >= 10 && both <= 2) tagPair.push({ a: a.name, b: b.name, ca: a.count, cb: b.count, both, score: a.count * b.count });
}
tagPair.sort((x,y)=> y.score - x.score);
tagPair.slice(0,6).forEach(p => opps.push({ level:'gap', name: p.a+' × '+p.b,
  title: '「'+p.a+'」×「'+p.b+'」几乎没结合过',
  reason: p.a+' 有 '+p.ca+' 篇、'+p.b+' 有 '+p.cb+' 篇，但交叉仅 '+p.both+' 篇。你在两个方向都有积累，却从未结合——这正是一片空白市场。建议用「以 '+p.b+' 为切口，讲 '+p.a+' 的真实场景」写一篇代表作。', }));
// 3) 沉寂：历史多但近两年很少写
tagStats.filter(t => t.count >= 18 && t.recent <= 4)
  .sort((a,b)=> a.recent - b.recent)
  .slice(0,3)
  .forEach(t => opps.push({ level:'revive', name: t.name,
    title: '「'+t.name+'」历史很厚，但近两年几乎没写',
    reason: '历史 '+t.count+' 篇、近两年仅 '+t.recent+' 篇（最新 '+t.latest+'）。如果仍是你的兴趣，值得重启：更新文、回顾、或一张清单。' }));
// 4) 上升：近两年占历史大半
tagStats.filter(t => t.count >= 4 && t.recent >= 5 && t.recent / t.count >= 0.75)
  .sort((a,b)=> b.recent - a.recent)
  .slice(0,4)
  .forEach(t => opps.push({ level:'trend', name: t.name,
    title: '「'+t.name+'」正在悄悄上升',
    reason: '近两年 '+t.recent+' 篇，占历史 '+t.count+' 篇的 '+Math.round(t.recent/t.count*100)+'%。读者可能正在转向，值得做成有主题的栏目。' }));
const levelOrder = { go: 0, gap: 1, trend: 2, revive: 3, type: 4, evolve: 5 };
// ---- 5) 内容类型缺口：某些内容类型写得少，可能是差异化机会 ----
const TYPE_NAME = { knowledge:'知识深挖', experience:'经验干货', story:'故事分享', opinion:'观点输出', tutorial:'方法教程', review:'测评', list:'清单整理', reflection:'复盘反思' };
const TYPE_BIAS = { list:'清单型内容少，容易做成高收藏「干货合集」', tutorial:'教程型内容少，步骤化内容可沉淀为可复制方法论', review:'测评型内容少，是种草/带货的强入口', opinion:'观点型内容少，立场鲜明更容易建立人设、引发讨论' };
const typeCount = {};
for (const a of clean) if (a.ct && a.ct !== 'story') typeCount[a.ct] = (typeCount[a.ct] || 0) + 1;
const typeOpps = Object.keys(TYPE_BIAS)
  .filter(t => (typeCount[t] || 0) < 8)   // < 8 篇的类型缺口
  .filter(t => typeCount[t] > 0)          // 有少量已经写过，说明可写
  .map(t => ({ level:'type', name:'类型缺口：'+TYPE_NAME[t]||t,
    title: (typeCount[t]||0) + ' 篇「' + (TYPE_NAME[t]||t) + '」太少，是差异化空间',
    reason: (TYPE_BIAS[t]||'') + '。已有 '+ (typeCount[t]||0) +' 篇，可针对高频主题试试这类写法。' }));
opps.push(...typeOpps);
// ---- 6) 时间重写：同一主题跨度多年仍活跃，值得「多年后我怎么看」 ----
const curY = Y;
tagStats
  .filter(t => t.count >= 8 && t.first && t.latest)
  .map(t => { const span = curY - Number(t.first.slice(0,4)); return { ...t, span }; })
  .filter(t => t.span >= 4)      // 写了 4 年以上
  .filter(t => t.recent >= 2)    // 近期仍在写（不是沉寂）
  .sort((a, b) => b.count - a.count)
  .slice(0, 3)
  .forEach(t => opps.push({ level:'evolve', name:'′'+t.name+'′ 时间重写',
    title: '写过 '+t.span+' 年，值得来一篇「'+t.first.slice(0,4)+' 年 vs 现在」的重写',
    reason:'「'+t.name+'」从 '+t.first.slice(0,4)+' 年写到 '+t.latest.slice(0,4)+' 年，共 '+t.count+' 篇。观点会有演化，用「当时的误区 → 现在更成熟的做法」写一篇回顾文，最有个人辨识度。' }));
opps.sort((a,b)=> levelOrder[a.level]-levelOrder[b.level]);
// ---- 内容地图 ----
// TOPICS 单一真相来自 config/taxonomy.json 的 pillars（配置集中，不在脚本里重复）
const TOPICS = (tax.pillars || []).map(p => ({
  name: p.name,
  why: p.why || '',
  match: p.aliases || [],
}));
const assigned = clean.map(a => ({ ...a, topics: TOPICS.filter(t => a.tags.some(tag => t.match.includes(tag) || t.match.some(m => tag.includes(m)))).map(t => t.name) }));
const topicStats = TOPICS.map(tp => {
  const posts = assigned.filter(a => a.topics.includes(tp.name));
  const recent = posts.filter(a => monthsAgo(a.date) <= 24).length;
  return { name: tp.name, count: posts.length, recent, latest: posts.length ? posts[0].date : null,
    avgWc: posts.length ? Math.round(posts.reduce((s,a)=>s+a.wc,0) / posts.length) : 0,
    why: tp.why, topTitles: [...posts.filter(a => a.topics.length === 1), ...posts.filter(a => a.topics.length > 1)].slice(0, 5).map(a => a.title) };
});
const pairs = [];
for (let i = 0; i < TOPICS.length; i++) for (let j = i+1; j < TOPICS.length; j++) {
  const t1 = TOPICS[i].name, t2 = TOPICS[j].name;
  const both = assigned.filter(a => a.topics.includes(t1) && a.topics.includes(t2));
  if (both.length >= 2) pairs.push({ t1, t2, count: both.length, latest: both[0].date });
}
pairs.sort((a,b)=>b.count-a.count);
const bar = (n,max) => '<div class="bar"><i style="width:'+Math.round(n/(max||1)*100)+'%"></i></div>';
const CSS = GHIBLI_CSS + INTEL_EXTRA;
const NAV = '<a href="index.html">首页</a><a href="topics.html">主题</a><a href="map.html">内容地图</a><a href="timeline.html">时间线</a><a href="opportunity.html">选题机会</a><a href="potential.html">改写潜力</a><a href="archive.html">全部文章</a><a href="search.html">搜索</a><a class="nav-hl" href="about.html">我是谁</a></nav>';
const HEADER = GHIBLI_SKY + '<header><div class="wrap"><a class="site-logo" href="index.html">秋秋很开心</a><nav><a href="index.html">首页</a><a href="topics.html">主题</a><a href="map.html">内容地图</a><a href="timeline.html">时间线</a><a href="opportunity.html">选题机会</a><a href="potential.html">改写潜力</a><a href="archive.html">全部文章</a><a href="search.html">搜索</a><a class="nav-hl" href="about.html">我是谁</a></nav></div></header>';
const FOOTER = GHIBLI_FOOTER;
const page = (title, htitle, desc, body) => '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>'+title+' · 秋秋很开心</title><style>'+CSS+'</style></head><body>'+HEADER+'<main class="wrap"><div class="hero"><h1>'+htitle+'</h1><p class="tagline">'+desc+'</p></div>'+body+'</main>'+FOOTER+'</body></html>';
const maxN = Math.max(...topicStats.map(t => t.count));
const dashCards = topicStats.map(t => '<div class="card"><h3>'+esc(t.name)+'</h3><div class="n">'+t.count+'</div><div class="sub">近 2 年 '+t.recent+' 篇 · 最新 '+esc(t.latest)+'</div>'+bar(t.count,maxN)+'</div>').join('');
const mapCards = topicStats.map(t => '<div class="tp"><h3>'+esc(t.name)+'</h3><div class="why">'+esc(t.why)+'</div><div class="cnt">'+t.count+' 篇 · 最新 '+esc(t.latest)+'</div>'+bar(t.count,maxN)+'<div class="meta">均长 '+t.avgWc+' 字 · 近2年 '+t.recent+' 篇</div><details><summary>代表文章</summary>'+t.topTitles.map(x=>'<div class="tl">· '+esc(x)+'</div>').join('')+'</details></div>').join('');
const maxCross = pairs.length ? Math.max(...pairs.map(p=>p.count)) : 1;
const mapBody = '<h2 class="yhead">主题总览</h2><div class="dash">'+dashCards+'</div><h2 class="yhead">主题全景与代表内容</h2><div class="map-grid">'+mapCards+'</div><h2 class="yhead">主题交叉（已有内容）</h2><div class="map-grid">'+pairs.slice(0,6).map(p=>'<div class="tp"><h3>'+esc(p.t1+' × '+p.t2)+'</h3><div class="cnt">'+p.count+' 篇 · 最近 '+esc(p.latest)+'</div>'+bar(p.count,maxCross)+'</div>').join('')+'</div>';
const mapHtml = page('内容地图','内容地图','502 篇文章的分布与交叉', mapBody);
const relHtml = o => {
  // 从机会名提取可匹配的 tag（成果 title/pillar/tag 匹配）
  const t = o.name.replace(/[′时间重写类型缺口×「」]/g, '').trim();
  const hit = clean.find(a => a.title.includes(t) || (a.pillars||[]).includes(t) || (a.tags||[]).includes(t));
  // 用 archive.html 的权威链接（避免自己猜 hash 产生死链）
  const url = hit && ARCHIVE_LINK[hit.title];
  return url ? '<a class="rel" href="'+url+'">→ 相关素材：'+esc(hit.title)+'</a>' : '';
};
const oppBody = '<div class="legend"><span><i style="background:#4f8f5f"></i>建议深耕</span><span><i style="background:#5b8db8"></i>交叉机会</span><span><i style="background:#c2852f"></i>新兴上升</span><span><i style="background:#c25e4a"></i>沉寂主题</span><span><i style="background:#9b7ec9"></i>类型缺口</span><span><i style="background:#c76f9e"></i>时间重写</span></div><ol class="opp">'+opps.map((o,i)=>'<li class="'+o.level+'"><span class="badge">'+(i+1)+' · '+esc(o.name)+'</span><h4>'+esc(o.title)+'</h4><p>'+esc(o.reason)+'</p>'+relHtml(o)+'</li>').join('')+'</ol><div class="hint">小提示：灰色「相关素材」= 该机会在 archive 里找到的权威文章链接（非死链）。每次更新文章后运行 build_intel.mjs 即可刷新。</div>';
const oppHtml = page('选题机会','选题机会','从 502 篇历史里找「值得写但还没写」的切入点', oppBody);
fs.writeFileSync(path.join(OUT,'map.html'), mapHtml);
fs.writeFileSync(path.join(OUT,'opportunity.html'), oppHtml);
// ---- 多平台改写潜力（Phase 3 前置：规则估分，零 LLM） ----
const P_NUM = /[0-9０-９]/, P_YN = /(怎么|如何|为什么|多少钱|要不要|靠谱吗|值不值得|会不会|真的|能吗)/, P_LIST = /(清单|推荐|分享|种草|好物|攻略|步骤|方法|技巧|避坑|测评|合集|盘点)/, P_STORY = /(我|辞职|退休|不上班|FIRE|旅居|妈|老公|娃|北京|大理|钱|房|自由)/;
const P_TYPE = { story:{xhs:.8,video:.8}, experience:{xhs:.7,video:.85}, opinion:{xhs:.4,video:.7}, list:{xhs:.9,video:.55}, tutorial:{xhs:.6,video:.8}, review:{xhs:.85,video:.55}, reflection:{xhs:.5,video:.6}, knowledge:{xhs:.35,video:.5} };
const scored = clean.map(a => {
  const t = a.title, base = P_TYPE[a.ct] || {xhs:.5,video:.6};
  const xhs = Math.min(1, (base.xhs||.5)+ (P_LIST.test(t)? .18:0) + (P_NUM.test(t)? .07:0) + (a.pillars.includes('geek')? .06:0));
  let video = Math.min(1, Math.max(0, (base.video||.6) + (P_YN.test(t)? .15:0) + (P_NUM.test(t)? .08:0) + (a.pillars.includes('growth')||a.pillars.includes('freedom')? .05:0) + (a.wc>2200? .15:(a.wc<600?-.1:0))));
  const repost = Math.min(1, (a.ct==='experience'||a.ct==='reflection'? .7:.52) + (a.pillars.includes('ai')? .08:0) + (a.wc>2500? .12:0));
  return { title:t, date:a.date, xhs, video, repost, ct:a.ct, wc:a.wc };
});
const P_NAMES = {freedom:'财务自由',lifestyle:'生活方式',growth:'自我成长',ai:'AI与工具',reading:'读书',geek:'好物分享'};
const potTop = (key, lab, min=.55) => {
  const rows = scored.filter(a => a[key] >= min).sort((a,b)=>b[key]-a[key]).slice(0,6);
  return '<h2 class="yhead">'+lab+'</h2><ol class="opp">'+ rows.map((a,i)=>'<li><span class="badge">'+Math.round(a[key]*100)+' 分</span><span class="badge">'+a.date+'</span><h4>'+esc(a.title)+'</h4><p>'+a.wc+' 字 · '+esc(a.ct||'-')+'</p></li>').join('')+'</ol>';
};
// 结构化选题数据：供其它构建阶段（如首页「今日值得写」）复用
fs.writeFileSync(path.join(OUT,'intel.json'), JSON.stringify({
  generatedAt: new Date().toISOString().slice(0,10),
  topics: topicStats.map(t => ({ name:t.name, count:t.count, recent:t.recent })),
  opps: opps.map(o => ({ level:o.level, name:o.name, title:o.title, reason:o.reason })),
}));
// 多平台改写潜力页面
const potHtml = '<p class="hint" style="text-align:center">基于标题/类型/长度/主题的规则预估，挑出最适合改写迁移到其它平台的候选（不是人工结论）。</p>' +
  potTop('xhs','小红书潜力 Top',.6) + potTop('video','视频口播潜力 Top',.6) + potTop('repost','公众号续篇/复利潜力 Top',.6) ;
fs.writeFileSync(path.join(OUT,'potential.html'), page('多平台改写潜力','内容生产','把已有文章改写到 小红书 / 视频 / 公众号', potHtml));
console.log('map done: '+topicStats.map(t=>t.name+":"+t.count).join(' '));
console.log('pairs:',pairs.length,' opps:',opps.length, opps.map(o=>o.level).join(','));
// ---- 时间线：按年统计文章量与当年代表（9 年内容演化） ----
const topCt = list => {
  const m = {};
  let mx = '', n = 0;
  for (const a of list) { const c = a.ct || '-'; m[c] = (m[c] || 0) + 1; if (m[c] > n) { n = m[c]; mx = c; } }
  return mx;
};
const byYear = new Map();
for (const a of clean) {
  const y = a.date.slice(0, 4);
  if (!byYear.has(y)) byYear.set(y, []);
  byYear.get(y).push(a);
}
const years = [...byYear.keys()].sort();
const maxY = Math.max(...years.map(y => byYear.get(y).length));
const tlCards = years.map(y => {
  const list = byYear.get(y).sort((a,b)=>b.date-a.date);
  const reps = list.slice(0, 3).map(a => '<div class="tl">· '+esc(a.title)+'（'+esc(a.ct||'-')+'）</div>').join('');
  return '<div class="tp"><h3>'+y+' · '+list.length+' 篇</h3>'+bar(list.length, maxY)+'<div class="why">'+list.length+'篇 · 类型最多：'+esc(topCt(list))+'</div>'+'<details><summary>代表文章</summary>'+reps+'</details></div>';
}).join('');
const tlHtml = page('时间线','时间线','九年内容演化的轨迹', '<h2 class="yhead">按年的内容量</h2><div class="map-grid">'+tlCards+'</div>');
fs.writeFileSync(path.join(OUT,'timeline.html'), tlHtml);
