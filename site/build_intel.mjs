import fs from 'node:fs';
import path from 'node:path';
const OUT = path.join(import.meta.dirname, '..', 'docs');
const DATA = path.join(import.meta.dirname, '..', 'content/公众号/outputs/articles_data.json');
const raw = JSON.parse(fs.readFileSync(DATA, 'utf8'));
const clean = raw
  .filter(a => a && a.title && a.date)
  .map(a => ({
    title: (a.title || '').trim(),
    date: (a.date || '').slice(0, 10),
    tags: (Array.isArray(a.tags) ? a.tags.map(t => t.trim()).filter(Boolean) : []).map(t => t.includes('/') ? t.split('/').pop() : t),
    wc: Number(a.word_count) || 0,
  }))
  .sort((a, b) => (a.date < b.date ? 1 : -1));
const esc = s => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const Y = 2026, M = 9;
const monthsAgo = d => { const y = Number(d.slice(0,4)), m = Number(d.slice(5,7)); return Math.max(0, (Y - y) * 12 + (M - m)); };
const tagCount = new Map(), tagRecent = new Map(), tagLatest = new Map();
for (const a of clean) for (const t of a.tags) {
  tagCount.set(t, (tagCount.get(t) || 0) + 1);
  if (monthsAgo(a.date) <= 24) tagRecent.set(t, (tagRecent.get(t) || 0) + 1);
  const lt = tagLatest.get(t);
  if (!lt || a.date > lt) tagLatest.set(t, a.date);
}
const tagStats = [...tagCount.entries()]
  .map(([name, count]) => ({ name, count, recent: tagRecent.get(name) || 0, latest: tagLatest.get(name) || '' }))
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
  reason: p.a+' 有 '+p.ca+' 篇、'+p.b+' 有 '+p.cb+' 篇，但交叉仅 '+p.both+' 篇。写一篇结合文，可能成为代表作。' }));
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
const levelOrder = { go: 0, gap: 1, trend: 2, revive: 3 };
opps.sort((a,b)=> levelOrder[a.level]-levelOrder[b.level]);
// ---- 内容地图 ----
const TOPICS = [
  { name: '生活方式', match: ['生活方式', '旅行', '情感'] },
  { name: '自我成长', match: ['自我成长', '方法教程', '经验分享', '个人复盘'] },
  { name: '读书', match: ['读书', '书单推荐'] },
  { name: 'AI 与工具', match: ['AI'] },
  { name: '好物分享', match: ['好物', '好物推荐'] },
  { name: '财务自由', match: ['理财', '搞钱', '存钱', '提前退休', '理财分析'] },
];
const assigned = clean.map(a => ({ ...a, topics: TOPICS.filter(t => a.tags.some(tag => t.match.includes(tag) || t.match.some(m => tag.includes(m)))).map(t => t.name) }));
const topicStats = TOPICS.map(tp => {
  const posts = assigned.filter(a => a.topics.includes(tp.name));
  const recent = posts.filter(a => monthsAgo(a.date) <= 24).length;
  return { name: tp.name, count: posts.length, recent, latest: posts.length ? posts[0].date : null,
    avgWc: posts.length ? Math.round(posts.reduce((s,a)=>s+a.wc,0) / posts.length) : 0,
    topTitles: posts.slice(0, 5).map(a => a.title) };
});
const pairs = [];
for (let i = 0; i < TOPICS.length; i++) for (let j = i+1; j < TOPICS.length; j++) {
  const t1 = TOPICS[i].name, t2 = TOPICS[j].name;
  const both = assigned.filter(a => a.topics.includes(t1) && a.topics.includes(t2));
  if (both.length >= 2) pairs.push({ t1, t2, count: both.length, latest: both[0].date });
}
pairs.sort((a,b)=>b.count-a.count);
const bar = (n,max) => '<div class="bar"><i style="width:'+Math.round(n/(max||1)*100)+'%"></i></div>';
const CSS = 'body{font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif;background:#faf5ec;color:#2b2620;margin:0;line-height:1.75;} .wrap{max-width:1080px;margin:0 auto;padding:0 28px;} a{color:inherit;text-decoration:none;} header{position:sticky;top:0;background:rgba(250,245,236,.95);backdrop-filter:blur(8px);border-bottom:1px solid #ebe1d2;z-index:10;} header .wrap{display:flex;justify-content:space-between;align-items:center;padding:12px 0;} .site-logo{font-weight:700;color:#d2593a;font-size:16px;} nav a{margin-left:18px;color:#6d6458;font-size:14px;} nav a:hover{color:#d2593a;} .hero{padding:48px 0 24px;text-align:center;} .hero h1{font-size:34px;margin:0 0 8px;color:#b8482c;} .tagline{color:#6d6458;font-size:16px;} .dash{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:16px;margin:24px 0;} .card{background:#fffdf8;border:1px solid #e7e1d3;border-radius:16px;padding:18px 22px;} .card h3{margin:0 0 4px;font-size:18px;} .card .n{font-size:30px;font-weight:800;color:#b8482c;} .card .sub{color:#9b9083;font-size:13px;margin-top:4px;} .map-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:14px;margin:16px 0 32px;} .map-grid .tp{background:#fffdf8;border:1px solid #e4e1d5;border-radius:14px;padding:15px 18px;} .map-grid h3{margin:0 0 6px;font-size:17px;} .map-grid .cnt{font-size:14px;color:#6d6458;margin:4px 0;} .map-grid .meta{font-size:12px;color:#9b9083;margin-top:6px;} .bar{height:9px;background:#efe7d8;border-radius:99px;margin:8px 0 4px;overflow:hidden;} .bar i{display:block;height:100%;background:#d2593a;border-radius:99px;} details{margin-top:8px;} summary{cursor:pointer;font-size:13px;color:#b8482c;} .tl{font-size:13px;color:#6d6458;margin-top:3px;padding-left:10px;} .legend{display:flex;gap:18px;justify-content:center;font-size:13px;color:#6d6458;margin:18px 0 6px;} .legend i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:6px;vertical-align:middle;} .opp{list-style:none;margin:24px 0 12px;padding:0;} .opp li{background:#fffdf8;border:1px solid #e4e1d5;border-left:5px solid #444;border-radius:12px;padding:14px 18px;margin:12px 0;} .opp li.go{border-left-color:#4f8f5f;} .opp li.gap{border-left-color:#5b8db8;} .opp li.trend{border-left-color:#c2852f;} .opp li.revive{border-left-color:#c25e4a;} .opp h4{margin:0 0 6px;font-size:16px;} .opp p{margin:0;color:#6d6458;font-size:14px;} .badge{display:inline-block;background:#f0e9da;border-radius:99px;padding:2px 10px;font-size:12px;color:#8a6f4f;margin-bottom:6px;} .hint{background:#fdf8ef;border:1px solid #eeddc2;border-radius:14px;padding:12px 18px;font-size:13px;color:#8a6f4f;margin-top:12px;} footer{text-align:center;color:#9b9083;font-size:13px;padding:28px 0 36px;border-top:1px solid #e7e1d3;} h2.yhead{color:#b8482c;margin:34px 0 12px;border-bottom:1px solid #e7e1d3;padding-bottom:6px;font-size:19px;}';
const NAV = '<a href="index.html">首页</a><a href="topics.html">主题</a><a href="map.html">内容地图</a><a href="opportunity.html">选题机会</a><a href="atoms.html">内容原子</a><a href="archive.html">全部文章</a><a href="about.html">关于</a><a href="search.html">搜索</a>';
const HEADER = '<header><div class="wrap"><a class="site-logo" href="index.html">秋秋很开心</a><nav>'+NAV+'</nav></div></header>';
const FOOTER = '<footer>© 2026 秋秋很开心 · 内容地图与选题机会由全部 502 篇文章自动生成</footer>';
const page = (title, htitle, desc, body) => '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>'+title+' · 秋秋很开心</title><style>'+CSS+'</style></head><body>'+HEADER+'<main class="wrap"><div class="hero"><h1>'+htitle+'</h1><p class="tagline">'+desc+'</p></div>'+body+'</main>'+FOOTER+'</body></html>';
const maxN = Math.max(...topicStats.map(t => t.count));
const dashCards = topicStats.map(t => '<div class="card"><h3>'+esc(t.name)+'</h3><div class="n">'+t.count+'</div><div class="sub">近 2 年 '+t.recent+' 篇 · 最新 '+esc(t.latest)+'</div>'+bar(t.count,maxN)+'</div>').join('');
const mapCards = topicStats.map(t => '<div class="tp"><h3>'+esc(t.name)+'</h3><div class="cnt">'+t.count+' 篇 · 最新 '+esc(t.latest)+'</div>'+bar(t.count,maxN)+'<div class="meta">均长 '+t.avgWc+' 字 · 近2年 '+t.recent+' 篇</div><details><summary>代表文章</summary>'+t.topTitles.map(x=>'<div class="tl">· '+esc(x)+'</div>').join('')+'</details></div>').join('');
const maxCross = pairs.length ? Math.max(...pairs.map(p=>p.count)) : 1;
const mapBody = '<h2 class="yhead">主题总览</h2><div class="dash">'+dashCards+'</div><h2 class="yhead">主题全景与代表内容</h2><div class="map-grid">'+mapCards+'</div><h2 class="yhead">主题交叉（已有内容）</h2><div class="map-grid">'+pairs.slice(0,6).map(p=>'<div class="tp"><h3>'+esc(p.t1+' × '+p.t2)+'</h3><div class="cnt">'+p.count+' 篇 · 最近 '+esc(p.latest)+'</div>'+bar(p.count,maxCross)+'</div>').join('')+'</div>';
const mapHtml = page('内容地图','内容地图','502 篇文章的分布与交叉', mapBody);
const oppBody = '<div class="legend"><span><i style="background:#4f8f5f"></i>建议深耕</span><span><i style="background:#5b8db8"></i>交叉机会</span><span><i style="background:#c2852f"></i>新兴上升</span><span><i style="background:#c25e4a"></i>沉寂主题</span></div><ol class="opp">'+opps.map((o,i)=>'<li class="'+o.level+'"><span class="badge">'+(i+1)+' · '+esc(o.name)+'</span><h4>'+esc(o.title)+'</h4><p>'+esc(o.reason)+'</p></li>').join('')+'</ol><div class="hint">规则：按全部文章的标签出现频率、近两年活跃度、标签交叉空白自动计算。每次更新文章后运行 build_intel.mjs 即可刷新。</div>';
const oppHtml = page('选题机会','选题机会','从 502 篇历史里找「值得写但还没写」的切入点', oppBody);
fs.writeFileSync(path.join(OUT,'map.html'), mapHtml);
fs.writeFileSync(path.join(OUT,'opportunity.html'), oppHtml);
console.log('map done: '+topicStats.map(t=>t.name+":"+t.count).join(' '));
console.log('pairs:',pairs.length,' opps:',opps.length, opps.map(o=>o.level).join(','));

