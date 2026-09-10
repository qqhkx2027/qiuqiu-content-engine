# 秋秋的个人网站

秋秋很开心/秋秋在分享 公众号历史文章的个人网站：501 篇完整存档。

**线上地址**：https://qqhkx2027.github.io/qiuqiu-site/

## 站点结构
- index.html 首页（按年份归档）
- topics.html 按主题浏览（生活方式/自我成长/读书/AI工具/好物/财务自由）
- archive.html 全部文章
- about.html 关于
- post/ 501 篇文章详情页（含图片、阅读时长、原文链接、上一篇/下一篇）
- sitemap.xml / robots.txt / rss.xml SEO 文件

## 如何更新文章
1. 更新内容库 qiuqiu-content-engine 的《秋秋很开心》《秋秋在分享》md 文件
2. 运行 `node build3.mjs`（重新生成站点）
3. 运行 `node make_topics.mjs`（更新主题页）
4. 提交推送 main，GitHub Pages 自动部署

## 技术栈
- 纯静态 HTML（零依赖），Node 脚本生成
- 部署：GitHub Pages（仓库根目录）
- 图片：直接引用公众号图床（mmbiz.qpic.cn）
