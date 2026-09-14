(function(){
  var box = document.getElementById('sq');
  var out = document.getElementById('results');
  if (!box || !out) return;
  var ALL = [];
  var initQ = new URLSearchParams(location.search).get('q') || '';
  if (initQ) box.value = initQ;
  var esc = function(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;'); };
  var PN = {Freedom:'财务自由',Lifestyle:'生活方式',Growth:'成长',Reading:'读书',AI:'AI',Geek:'好物'};
  var TN = {experience:'经验',story:'故事',tutorial:'教程',opinion:'观点',knowledge:'知识',review:'测评',list:'清单',reflection:'复盘'};
  var card = function(t){
    var tags = (t.tags || []).map(function(x){ return '<span>' + esc(x) + '</span>'; }).join('');
    var pill = (t.pillars || []).map(function(p){ return '<span style="font-size:12px;color:#b8482c;border:1px solid #ecd9cf;border-radius:99px;padding:1px 7px;margin-right:4px">' + esc(PN[p]||p) + '</span>'; }).join('');
    if (t.content_type) pill += '<span style="font-size:12px;color:#3f6b58;border:1px solid #d3e2da;border-radius:99px;padding:1px 7px;margin-right:4px">' + esc(TN[t.content_type]||t.content_type) + '</span>';
    return '<a class="card" href="' + esc(t.source) + '" target="_blank" rel="noopener"><div class="card-meta"><time>' + t.date + '</time><span class="acct">' + esc(t.account) + '</span></div><h3>' + esc(t.title) + '</h3>' + (pill ? '<div class="tags">' + pill + '</div>' : '') + (tags ? '<div class="tags">' + tags + '</div>' : '') + '</a>';
  };
  function draw(){
    var q = (box.value || '').trim().toLowerCase();
    var pf = window.__pf || '', tf = window.__tf || '';
    var L = ALL.filter(function(x){
      if (pf && (x.pillars||[]).indexOf(pf) < 0) return false;
      if (tf && x.content_type !== tf) return false;
      return q ? (x.title + ' ' + x.account + ' ' + x.date + ' ' + (x.tags||[]).join(' ')).toLowerCase().indexOf(q) > -1 : true;
    });
    var active = q || window.__pf || window.__tf;
    var head = '<p class="search-hint">' + (active ? '找到 <b>' + L.length + '</b> 篇' : '共 ' + ALL.length + ' 篇 · 输入关键词试试') + '</p>';
    out.innerHTML = head + (L.length ? '<div class="grid">' + L.slice(0, active ? 300 : 36).map(card).join('') + '</div>' : '<p class="search-hint">没有匹配结果，换个筛选试试</p>');
  }
  box.addEventListener('input', draw);
  // 注入「主题 / 类型」下拉（从数据动态取值）
  var pfBar = document.createElement('div');
  pfBar.style.cssText = 'display:flex;justify-content:center;gap:8px;flex-wrap:wrap;margin:6px 0 2px';
  pfBar.innerHTML = '<select id="pfSel"><option value="">主题</option></select><select id="tfSel"><option value="">类型</option></select>';
  box.parentNode.insertBefore(pfBar, box.nextSibling);
  var pfSel = pfBar.querySelector('#pfSel'), tfSel = pfBar.querySelector('#tfSel');
  fetch('search.json').then(function(r){ return r.json(); }).then(function(d){
    ALL = d;
    var ps = d.reduce(function(a,x){ (x.pillars||[]).forEach(function(p){ if(a.indexOf(p)<0) a.push(p); }); return a; }, []);
    ps.forEach(function(p){ var o=document.createElement('option'); o.value=p; o.textContent=(PN[p]||p); pfSel.appendChild(o); });
    var ts = d.reduce(function(a,x){ if(x.content_type && a.indexOf(x.content_type)<0) a.push(x.content_type); return a; }, []);
    ts.forEach(function(t){ var o=document.createElement('option'); o.value=t; o.textContent=(TN[t]||t); tfSel.appendChild(o); });
    pfSel.onchange = function(){ window.__pf = pfSel.value; draw(); };
    tfSel.onchange = function(){ window.__tf = tfSel.value; draw(); };
    draw();
  }).catch(function(){ out.innerHTML = '<p class="search-hint">搜索数据加载失败</p>'; });
})();
