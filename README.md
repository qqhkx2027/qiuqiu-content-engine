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

### 更新站点
```bash
# 1. 在 content/公众号/ 里更新文章 md
# 2. 重新生成元数据索引（输出到 content/公众号/outputs/，不入库）
python content/公众号/outputs/extract_articles.py
# 3. 构建站点到 docs/
(cd site && node build3.mjs)
(cd site && node make_topics.mjs)
(cd site && node build_extra.mjs)
(cd site && node build_intel.mjs)
(cd site && node linkcheck.mjs)

构建后提交 docs/ 即可，GitHub Pages 托管 docs/ 目录。

### 内容地图与选题机会

`site/build_intel.mjs` 会自动分析全部文章标签，生成两个页面：

- `docs/map.html`（内容地图）：502 篇文章按主题统计分布、均长、最近更新、代表文章、主题交叉覆盖
- `docs/opportunity.html`（选题机会）：自动推荐「建议深耕」「主题交叉空白」「沉寂主题」三类选题，帮你看清已经写过什么、还缺什么

刷新方法：改完文章后重跑 `node site/build_intel.mjs` 即可，无需手动维护。
