# qiuqiu-content-engine

秋秋很开心 / 秋秋在分享 · 公众号历史文章的内容资产与个人网站。

**线上地址**：https://qqhkx2027.github.io/qiuqiu-content-engine/（GitHub Pages 自动部署）

---

## 项目结构（一目了然）

```
qiuqiu-content-engine/
├── content/
│   ├── 公众号/                 # Markdown 文章库（事实真相源，502 篇）
│   │   ├── 《秋秋很开心》/      # 2026 新号：学习 / 成长 / 好物
│   │   ├── 《秋秋在分享》/      # 历史号：财务自由 / 投资 / 旅居
│   │   ├── extract_articles.py # 抽取元数据 + 按 taxonomy 自动打标
│   │   └── outputs/            # 生成：articles_data.json（内容清单，见 .gitignore）
│   ├── drafts/                 # 草稿区（创作中，未发布）
│   └── ideas/                  # 选题灵感
├── site/                       # 抓取脚本 + 站点构建脚本
│   ├── fetch_*.mjs              # 抓取新文章（单篇补抓 / 本地轮询）
│   ├── build*.mjs / theme.mjs  # 站点构建（CI / 本地均可跑）
│   └── package.json
├── config/                     # 站点配置 + 内容地图
│   ├── taxonomy.json           # 内容地图：pillars + content_types + aliases
│   ├── site.json               # 站点风格配置
│   └── url_migrations.json
├── content_engine.py           # 本地语义检索（Chroma）index / search / suggest
├── doc/                        # 架构文档：content-model.md（内容模型）· workflows.md（操作手册）
├── tests/                      # 轻量回归测试（python3 tests/test_extract.py）
├── docs/                       # 构建产物（GitHub Pages 根，勿手工改）
└── .github/workflows/          # CI：自动构建 + 发布
```

## 内容资产层（Content Engine 的核心）

把 `content/公众号/` 的 502 篇 md 理解成**可检索、可归类的「内容资产库」**，而非一堆文件。三种视角：

- **内容地图**：`config/taxonomy.json` 定义「6 大支柱 pillar + 8 种内容类型」，每篇有别名表。
- **自动打标**：`extract_articles.py` 读取 taxonomy，在标题+描述+标签里用别名匹配，自动给出每篇的 `pillars`（内容支柱）和 `content_type`（内容类型）——不改原文件，实时推导。
- **阅读依据**：`doc/content-model.md` 定义了内容模型与字段口径。

## 抓取链路（两种场景）

| 场景 | 脚本 | 何时用 | 依赖 |
|---|---|---|---|
| **单篇补抓**（按链接补历史） | `site/fetch_by_url.mjs` | 手动补几篇缺的文章 | 一个或多个 mp.weixin.qq.com 链接 |
| **本地服务器轮询**（cron 增量） | `site/fetch_wemp.mjs` | 服务器上已配好 we-mp-rss 实例，定时入库（`~/bin/bridge_wechat.sh`） | 本地 we-mp-rss 服务 |

> 官方微信读书直连（`fetch_weread_direct.mjs` + CI 自动拉取）已移除；发布由手动补充 + `bridge_wechat.sh`（服务器 cron）统一推进，再经 CI 自动构建。

## 网站构建 / 更新流程

推送 `content/公众号/**` 或 `site/**` 改动 → GitHub Actions 自动：
`extract_articles.py`(抽取元数据) → `build_all.mjs`(转 docs/) → 提交 + 部署 GitHub Pages。全程无需本地操作。

**本地手动预览**：

```bash
python3 content/公众号/extract_articles.py   # 生成文章数据
cd site && node build_all.mjs                # 构建到 docs/（可在任意目录执行）
```

## 本地语义检索（内容资产的查询层）

`content_engine.py` 用 Chroma 给 502 篇建语义向量索引，做**按意思搜**而非按关键词搜。这是内容资产库的「查询口语」：想找 FIRE + 经验 + 旅居，直接描述意图即可。

```bash
.venv/bin/python content_engine.py index                    # 建（或更新）索引
.venv/bin/python content_engine.py search "当年为什么不上班" -n 8   # 语义搜索
.venv/bin/python content_engine.py suggest "退休生活月开销"         # 找历史 + 给新选题
```

索引数据在 `data/chroma/`（`.gitignore`，不入库）。首次需 `.venv`：
`python3 -m venv .venv && .venv/bin/pip install -r requirements.txt`

---

## 开发约定

- **文章真相源** 是 `content/公众号/*.md`，`docs/` 为构建产物不应手工改。
- 新增文章只需加 md 文件，构建/发布由 CI 接管。
- 历史遗留的 wewe-rss 相关脚本（`fetch_wechat.mjs`、`setup-wewe-rss.sh`）因 wewe 转发服务已弃用而移除。