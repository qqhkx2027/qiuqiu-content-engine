import fs from 'node:fs';
import path from 'node:path';
const SITE = path.join(import.meta.dirname, '..', 'docs');
const walk = [];
(function w(d){ for (const f of fs.readdirSync(d)) { const p = path.join(d,f); if (fs.statSync(p).isDirectory()) { if (!p.endsWith('public') && !p.endsWith('public2') && !p.endsWith('.git')) w(p); } else walk.push(p); } })(SITE);
let bad = 0, total = 0; const samples = [];
for (const f of walk.filter(x => x.endsWith('.html'))) {
  const h = fs.readFileSync(f, 'utf8');
  const rel = path.relative(SITE, f).split(path.sep).join('/');
  for (const m of h.matchAll(/href="([^"]*)"/g)) {
    let t = m[1];
    if (!t || t.startsWith('http') || t.startsWith('#') || t.startsWith('mailto')) continue;
    total++;
    let resolved;
    if (t.startsWith('/')) resolved = path.resolve(SITE, '.' + t);
    else resolved = path.resolve(path.dirname(path.join(SITE, rel)), t);
    resolved = resolved.split('#')[0].split('?')[0];
    if (!fs.existsSync(resolved)) { bad++; if (samples.length < 8) samples.push(rel + ' -> ' + t); }
  }
}
console.log('链接总数: ' + total + ' 坏链: ' + bad + (samples.length ? '\n样例:\n' + samples.join('\n') : ''));
