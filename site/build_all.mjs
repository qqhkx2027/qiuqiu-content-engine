// 一键全站构建入口：node build_all.mjs（可在仓库任意目录执行）
// 依次执行：基础页 → 主题页 → 认识秋秋 → 搜索/附加 → 内容地图/选题 → 内容原子 → 链接检查
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

const steps = [
  ['build3.mjs', '基础页面（首页/文章页）'],
  ['make_topics.mjs', '主题页'],
  ['build_about.mjs', '认识秋秋数据主页'],
  ['build_extra.mjs', '搜索页/存档/过滤器注入'],
  ['build_intel.mjs', '内容地图/选题机会'],
  ['build_atoms.mjs', '内容原子'],
  ['linkcheck.mjs', '链接完整性检查'],
];

for (const [file, label] of steps) {
  process.stdout.write('▶ ' + label + ' (' + file + ')\n');
  execSync('node ' + file, { stdio: 'inherit', cwd: here });
}
console.log('\n✅ 全站构建完成，docs/ 已更新');
