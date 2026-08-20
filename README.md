# qiuqiu-content-engine

秋秋很开心的本地内容资产、语义检索与选题排期工具。历史公众号文章位于 `content/公众号/`。

## 初始化

```bash
cd 05-Agents/qiuqiu-content-engine
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
