import fs from 'node:fs';
import path from 'node:path';
const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'docs');
const DATA = path.join(ROOT, 'content/公众号/outputs/articles_data.json');
const raw = JSON.parse(fs.readFileSync(DATA, 'utf8'));
const clean = raw.filter(a => a && a.title && a.date);
const accounts = [...new Set(clean.map(a => (a.account || '').trim()).filter(Boolean))].sort();
const cnt = ac => clean.filter(a => (a.account || '').trim() === ac).length;
const filterCss = '<style>.acct-filter{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin:14px 0 22px;padding:14px 18px;background:rgba(255,253,246,.75);border:1.5px dashed var(--line);border-radius:16px;}.af-label{font-size:14px;font-weight:700;color:var(--green-deep);align-self:center;margin-right:2px;}.af-btn{background:var(--paper);border:1.5px solid var(--line);border-radius:999px;padding:7px 20px;font-size:14px;font-weight:600;color:var(--ink);cursor:pointer;transition:.15s;font-family:inherit;}.af-btn:hover{border-color:var(--green);color:var(--green-deep);}.af-btn.active{background:var(--green-deep);border-color:var(--green-deep);color:#fff;}</style>';
const filterHtml = '<div class="acct-filter" id="acctFilter"><span class="af-label">账号</span><button class="af-btn active" data-act="all">全部 · ' + clean.length + '</button>' + accounts.map(ac => '<button class="af-btn" data-act="' + ac + '">' + ac + ' · ' + cnt(ac) + '</button>').join('') + '</div>';
const filterJs = '<script>(function(){var cards=[].slice.call(document.querySelectorAll("a.card"));var ct=function(c){var t=c.querySelector(".acct");return t?t.textContent:"";};var btns=[].slice.call(document.querySelectorAll(".af-btn"));btns.forEach(function(b){b.addEventListener("click",function(){btns.forEach(function(x){x.classList.remove("active")});b.classList.add("active");var act=b.getAttribute("data-act");cards.forEach(function(c){var show=(act==="all"||ct(c).indexOf(act)>-1);c.style.display=show?"":"none";});});});})();</script>';
['index.html', 'archive.html'].forEach(function(fn) {
  const p = path.join(OUT, fn);
  let h = fs.readFileSync(p, 'utf8');
  if (h.includes('acct-filter')) { console.log('filter already in', fn); return; }
  h = h.replace('</style>', filterCss + '</style>');
  h = h.replace('<div class="grid">', filterHtml + '<div class="grid">');
  h = h.replace('</main>', filterJs + '</main>');
  fs.writeFileSync(p, h);
  console.log('filter injected:', fn);
});
