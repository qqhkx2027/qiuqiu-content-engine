# 向量库搜索参考

本 skill 的向量检索复用 **qiuqiu-content-engine** 的统一 CLI `content_engine.py`（仓库根），不单独维护脚本——单一真相，避免两套 embedding/集合分叉。

## 位置

- 向量库：engine 仓库 `data/chroma/`（chroma，集合名 `qiuqiu-wechat`）——由 `content_engine.py index` 建立
- CLI：`/home/wangsiji/projects/qqhkx/qiuqiu-content-engine/content_engine.py`
- article 真相源：`content/公众号/`（`《秋秋很开心》` + `《秋秋在分享》` 两个子目录）

## 前置：确保向量库已建

```bash
cd /home/wangsiji/projects/qqhkx/qiuqiu-content-engine
# 若 data/chroma 不存在或文章有更新：
python3 -m venv .venv 2>/dev/null; .venv/bin/pip install -r requirements.txt -q 2>/dev/null
.venv/bin/python content_engine.py index
```

## 搜索命令（统一走 engine CLI）

```bash
cd /home/wangsiji/projects/qqhkx/qiuqiu-content-engine
.venv/bin/python content_engine.py search "退休 旅居 花费" -n 5
# 按支柱/类型过滤：
.venv/bin/python content_engine.py search "AI 提效" --pillar ai --type experience
# 选题助手（历史参考+排期建议）：
.venv/bin/python content_engine.py suggest "旅居开销"
# 盘点存量（看可复用资源）：
.venv/bin/python content_engine.py catalog
```

## 输出

CLI 按行打印：`[标题](obsidian://open?path=...)` + 发布日期 + 距离(越小越相关) + pillars + 类型 + description。全文在 `content/公众号/` 源 md，用 `read_file` 读。

## 已知局限 & 双路径互补

### 假阳性问题

向量库对**地名**（大理、威海、三亚等）和**高频词**（"学习""生活""每天"）搜索时容易命中文末签名模板（"喜欢记得星标""粉丝微信…"），返回相似度虚高但内容无关。

**解决：双路径互补**

| 路径 | 工具 | 适用场景 |
|------|------|---------|
| 向量库 | `content_engine.py search` | 语义匹配：找抽象话题/语气样本/风格参考 |
| 文件系统 | Hermes `search_files` | 精确匹配：某地名/事件出现在哪些文章，直接读全文 |

```bash
# 向量库搜完，补文件搜索（Hermes 工具 search_files）
pattern="大理" target="content" path="content/公众号/"
pattern="旅居" target="content" path="/home/wangsiji/projects/qqhkx/qiuqiu-content-engine/content/公众号/"
```

### 为什么两条都走

向量库适合用 Claude 快速扫"写过没、怎么写、有哪些真实数字"；文件名/全文精确匹配更可靠。**搜地名 → 两条都走；搜抽象话题（如 AI 提效）→ 向量库为主**。

## 写稿流程中的位置

```
0a. content_engine.py search → 看写过没、怎么写的、有没有能用到的真实数字
0b. 搜地名/具体事件时 → 补 search_files 精确匹配，读全文
1. 确认阶段 + 选题
2. 如需抓已发布全文 → scripts/clip_qiuqiu_published.py (mptext API)
3. 写初稿
```