# qiuqiu-content-engine

秋秋很开心 / 秋秋在分享 · 公众号历史文章的内容资产与个人网站。

**线上地址**：https://qqhkx2027.github.io/qiuqiu-content-engine/（GitHub Pages 自动部署）

---

## 项目结构（一目了然）

```
qiuqiu-content-engine/
├── content/
│   └── 公众号/                 # Markdown 文章库（事实真相源）
│       ├── 《秋秋很开心》/      # 学习 / 成长 / 好物
│       ├── 《秋秋在分享》/       # 财务自由 / 投资 / 旅居
│       └── ...（构建产物）
├── site/                       # 抓取脚本 + 站点构建脚本
│   ├── fetch_*.mjs              # 抓取新文章（详见下方「抓取链路」）
│   ├── build*.mjs / theme.mjs  # 站点构建（CI / 本地均可跑）
│   └── package.json
├── config/                     # 站点配置 / 分类法 / URL 迁移表
├── docs/                       # 构建产物（GitHub Pages 根目录）
└── .github/workflows/          # 自动构建 + 发布
```

## 抓取链路（三种场景）

| 场景 | 脚本 | 何时用 | 依赖 |
|---|---|---|---|
| **微信读书官方直连**（主链，CI 自动） | `site/fetch_weread_direct.mjs` | GitHub Actions 每天 01:00 UTC | 微信读书 Cookie（`WEREAD_COOKIE` secret） |
| **本地服务器轮询**（备用，cron） | `site/fetch_wemp.mjs` | 服务器上已配好 we-mp-rss 实例，定时增量入库 | 本地 we-mp-rss 服务 |
| **单篇补抓**（按链接补历史） | `site/fetch_by_url.mjs` | 手动补几篇缺的文章 | 一个或多个 mp.weixin.qq.com 链接 |

> 详细接入说明见 `site/README-weread-direct.md`（官方直连主链的 Cookie 获取与配置）。

## 网站构建 / 更新流程

推送 `content/公众号/**` 或 `site/**` 的改动 → GitHub Actions 自动跑：
`fetch_weread_direct`(拉取) → `extract_articles.py`(抽取元数据) → `build_all.mjs`(转 docs/) → 提交 + 部署 GitHub Pages。全程无需本地操作。

**本地手动预览**：

```bash
python3 content/公众号/extract_articles.py   # 生成文章数据
cd site && node build_all.mjs                # 构建到 docs/（可在任意目录执行）
```

## 本地语义检索（可选，已弃用）

仓库曾带语义检索工具 `content_engine.py`（Chroma）。当前站点的"内容地图/选题"已由 `site/build_intel.mjs` 取代，**不再依赖该工具**。如需临时启用：

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python content_engine.py index
.venv/bin/python content_engine.py search "普通人如何存钱并提前退休"
```

索引数据在 `data/chroma/`，已加入 `.gitignore`。

---

## 开发约定

- **文章真相源** 是 `content/公众号/*.md`，`docs/` 为构建产物不应手工改。
- 新增文章只需加 md 文件，构建/发布由 CI 接管。
- 历史遗留的 wewe-rss 相关脚本（`fetch_wechat.mjs`、`setup-wewe-rss.sh`）因 wewe 转发服务已弃用而移除。