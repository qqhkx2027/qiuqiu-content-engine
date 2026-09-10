# qiuqiu-content-engine

秋秋很开心的本地内容资产、语义检索与选题排期工具。历史公众号文章位于 `content/公众号/`。

## 初始化

```bash
cd qiuqiu-content-engine
.venv/bin/python content_engine.py index
```

索引使用本地中文字符 n-gram 向量，Chroma 只负责持久化和近邻检索；首次建立索引后，检索不需要联网，也不会把文章发送到外部服务。

## 搜索历史文章

```bash
.venv/bin/python content_engine.py search "普通人如何存钱并提前退休"
```

结果中的 `obsidian://` 链接可以直接回到 Obsidian 原文。

## 生成选题与排期建议

```bash
.venv/bin/python content_engine.py suggest "AI 帮普通人提升学习效率"
```

索引数据位于 `data/chroma/`，已加入 `.gitignore`，不提交到仓库。

## 个人网站（GitHub Pages）

`docs/` 目录是秋秋个人网站的静态产物（502 篇文章，文章页自动跳转公众号原文）。
线上地址：https://qqhkx2027.github.io/qiuqiu-content-engine/

### 更新站点（自动）
网站由 GitHub Actions 自动更新，无需手动操作：

- **推送新文章**：把新文章的 md 放进 `content/公众号/《秋秋很开心》/` 或 `content/公众号/《秋秋在分享》/`，提交推送到 main 后，Actions 会自动抽取 → 构建 → 发布，几分钟后线上出现新文章。
- **定时巡检**：每天 09:00（UTC+8）自动再跑一次构建，若文章有变化会自动提交更新。
- **手动触发**：仓库 → Actions → Auto Build & Deploy → Run workflow，可随时手动重建。
- 若本地想手动预览：`python content/公众号/extract_articles.py` 生成索引，然后 `(cd site && node build3.mjs && node make_topics.mjs && node build_extra.mjs && node build_intel.mjs && node build_atoms.mjs && node linkcheck.mjs)` 构建到 `docs/`。

构建后提交 docs/ 即可，GitHub Pages 托管 docs/ 目录。

### 内容地图与选题机会

`site/build_intel.mjs` 会自动分析全部文章标签，生成两个页面：

- `docs/map.html`（内容地图）：502 篇文章按主题统计分布、均长、最近更新、代表文章、主题交叉覆盖
- `docs/opportunity.html`（选题机会）：自动推荐「建议深耕」「主题交叉空白」「沉寂主题」三类选题，帮你看清已经写过什么、还缺什么

刷新方法：改完文章后重跑 `node site/build_intel.mjs` 即可，无需手动维护。
