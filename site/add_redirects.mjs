// 职责：为旧序号 URL（/post/0001.html）生成重定向到稳定 URL，并清理 post/ 下残留旧文件
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'docs');
const postDir = path.join(OUT, 'post');

const cur = JSON.parse(fs.readFileSync(path.join(OUT, 'urls.json'), 'utf8'));
const curByFile = new Map(cur.map(x => [x.filename, x.url]));

let old = [];
try {
  let rev = 'HEAD';
  const headU = JSON.parse(execSync('git show HEAD:docs/urls.json', { cwd: ROOT, encoding: 'utf8' }));
  if (headU.length && headU[0].url && !/\/post\/\d{4}.html/.test(headU[0].url)) {
    // HEAD 已是新格式（YYYYMMDD-hash），找历史里最近的旧格式清单
    const log = execSync(`git log --format=%H -- docs/urls.json`, { cwd: ROOT, encoding: 'utf8' }).trim().split('\n');
    for (const c of log) {
      try {
        const u = JSON.parse(execSync(`git show ${c}:docs/urls.json`, { cwd: ROOT, encoding: 'utf8' }));
        if (u.length && /\d{4}.html/.test(u[0].url)) { old = u; break; }
      } catch (_) {}
    }
  } else {
    old = headU;
  }
} catch (e) {
  console.log('旧文件不存在，跳过重定向生成');
}

const newNames = new Set(cur.map(x => x.url.replace(/^\//, '')));
let redir = 0, removed = 0;

for (const o of old) {
  const nu = curByFile.get(o.filename);
  if (!nu || nu === o.url) continue;
  const oldPath = path.join(OUT, o.url.replace(/^\//, ''));
  const rel = nu.replace(/^\//, '');
  const redirHtml = '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><meta http-equiv="refresh" content="0;url=' + rel + '"><title>跳转中 · 秋秋</title></head><body style="font-family:sans-serif;padding:60px;text-align:center;background:#fdf9f0"><p>文章已迁移到新地址</p><a href="' + rel + '" style="color:#5b7f63;font-weight:700">点击进入新文章页 →</a></body></html>';
  fs.writeFileSync(oldPath, redirHtml);
  redir++;
}

// 清理 post/ 下既不是当前新URL、也没有被写成重定向页的残留（旧清单里没有的孤儿文件）
for (const f of fs.readdirSync(postDir)) {
  if (f === '.gitkeep') continue;
  const rel = 'post/' + f;
  if (newNames.has(rel)) continue;
  const isOld = old.some(o => o.url.replace(/^\//, '') === rel);
  if (isOld) continue; // 已经是重定向页，保留
  fs.unlinkSync(path.join(postDir, f));
  removed++;
}
console.log('redirects:', redir, '| orphans removed:', removed);
