# qiuqiu-content-engine

秋秋很开心的内容资产与个人网站仓库。历史公众号文章位于 content/公众号/。

## 网站（GitHub Pages）

线上地址：https://qqhkx2027.github.io/qiuqiu-content-engine/
站点由 GitHub Actions 自动构建与发布（推文章 → 自动抽取 → 构建 → 上线），无需本地操作。

本地手动预览：

```bash
python3 content/公众号/extract_articles.py   # 生成文章数据
cd site && node build_all.mjs                # 构建到 docs/
```

## 本地语义检索与选题（可选）

仓库曾带一个本地语义检索工具（`content_engine.py`，使用 Chroma 构建本地索引）。当前已不依赖它，如需启用：

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python content_engine.py index
.venv/bin/python content_engine.py search "普通人如何存钱并提前退休"
.venv/bin/python content_engine.py suggest "AI 帮普通人提升学习效率"
```

索引数据位于 data/chroma/，已加入 .gitignore，不提交到仓库。
