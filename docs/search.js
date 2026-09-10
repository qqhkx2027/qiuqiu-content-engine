(function(){
  var box = document.getElementById('sq');
  var out = document.getElementById('results');
  if (!box || !out) return;
  var ALL = [];
  var initQ = new URLSearchParams(location.search).get('q') || '';
  if (initQ) box.value = initQ;
  var esc = function(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;'); };
  var card = function(t){
    var tags = (t.tags || []).map(function(x){ return '<span>' + esc(x) + '</span>'; }).join('');
    return '<a class="card" href="' + esc(t.source) + '" target="_blank" rel="noopener"><div class="card-meta"><time>' + t.date + '</time><span class="acct">' + esc(t.account) + '</span></div><h3>' + esc(t.title) + '</h3>' + (tags ? '<div class="tags">' + tags + '</div>' : '') + '</a>';
  };
  function draw(){
    var q = (box.value || '').trim().toLowerCase();
    var L = q ? ALL.filter(function(x){ return (x.title + ' ' + x.account + ' ' + x.date + ' ' + (x.tags||[]).join(' ')).toLowerCase().indexOf(q) > -1; }) : ALL;
    var head = '<p class="search-hint">' + (q ? '找到 <b>' + L.length + '</b> 篇' : '共 ' + ALL.length + ' 篇 · 输入关键词试试') + '</p>';
    out.innerHTML = head + (L.length ? '<div class="grid">' + L.slice(0, q ? 300 : 36).map(card).join('') + '</div>' : '<p class="search-hint">没有匹配结果，换个关键词试试</p>');
  }
  box.addEventListener('input', draw);
  fetch('search.json').then(function(r){ return r.json(); }).then(function(d){ ALL = d; draw(); }).catch(function(){ out.innerHTML = '<p class="search-hint">搜索数据加载失败</p>'; });
})();
