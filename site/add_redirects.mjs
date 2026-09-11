// 职责：为旧序号 URL（/post/0001.html）生成重定向到稳定 URL，并清理孤儿文件
// 迁移映射固化在 config/url_migrations.json（不依赖 git 历史，CI 可直接使用）
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'docs');
const postDir = path.join(OUT, 'post');

const cur = JSON.parse(fs.readFileSync(path.join(OUT, 'urls.json'), 'utf8'));
const curByFile = new Map(cur.map(x => [x.filename, x.url]));

// 1) 读取固定迁移映射 { oldRel: newRel }
const mig = {};
try {
  const migPath = path.join(ROOT, 'config/url_migrations.json');
  if (fs.existsSync(migPath)) Object.assign(mig, JSON.parse(fs.readFileSync(migPath, 'utf8')));
} catch (e) {}

const newNames = new Set(cur.map(x => x.url.replace(/^\//, '')));
let redir = 0, removed = 0;

// 2) 为旧 URL 生成重定向页（相对路径，兼容子路径部署）
for (const [oldRel, newRel] of Object.entries(mig)) {
  if (newRel && !newNames.has(newRel)) continue; // 目标已不存在则跳过
  const oldPath = path.join(postDir, oldRel);
  // 若旧文件已经就是新文章页（无迁移必要）跳过
  if (newNames.has(oldRel)) continue;
  if (oldRel === newRel) continue;
  const redirHtml = '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><meta http-equiv="refresh" content="0;url=' + newRel + '"><title>跳转中 · 秋秋</title></head><body style="font-family:sans-serif;padding:60px;text-align:center;background:#fdf9f0"><p>文章已迁移到新地址</p><a href="' + newRel + '" style="color:#5b7f63;font-weight:700">点击进入新文章页 →</a></body></html>';
  fs.writeFileSync(path.join(OUT, oldRel), redirHtml);
  redir++;
}

// 3) 清理孤儿：既不是当前新URL、也不是迁移源/目标 且没有重定向内容
for (const f of fs.readdirSync(postDir)) {
  if (f === '.gitkeep') continue;
  const rel = 'post/' + f;
  if (newNames.has(rel)) continue;
  if (Object.prototype.hasOwnProperty.call(mig, rel)) continue; // 作为迁移源保留
  try {
    const content = fs.readFileSync(path.join(postDir, f), 'utf8');
    if (content.includes('article已迁移') || content.includes('http-equiv="refresh"')) continue; // 已是重定向页
  } catch (_) {}
  fs.unlinkSync(path.join(postDir, f));
  removed++;
}
console.log('redirects:', redir, '| orphans removed:', removed);

