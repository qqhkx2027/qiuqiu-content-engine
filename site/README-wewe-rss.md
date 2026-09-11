+# 微信公众号自动更新接入说明（WeWe RSS）

目标：让「秋秋很开心」「秋秋在分享」的新文章自动进入本站。

## 架构总览

你已有一台服务器 → 服务器上跑 wewe-rss（每 6 小时自动抓两个公众号）→ GitHub Actions 每天定时调用服务器接口拉取新文章 → 转成 Markdown 入库 → 自动构建并发布到 GitHub Pages。

## 1. 在你的服务器部署 wewe-rss

前提：服务器装了 Docker（没有就 `curl -fsSL https://get.docker.com | sh`）。

```bash
docker run -d --name wewe-rss \
  -p 4000:4000 \
  -e DATABASE_TYPE=sqlite \
  -e AUTH_CODE=换成你的密码 \
  -e SERVER_ORIGIN_URL=http://你的服务器公网IP:4000 \
  -e CRON_EXPRESSION="0 */6 * * *" \
  -e FEED_MODE=fulltext \
  -v wewe-rss-data:/app/data \
  weev-rss/wewe-rss-sqlite:latest
```

（拉不到镜像就加 `--platform linux/amd64` 或换 Docker 源）

## 2. 首次配置公众号

1. 浏览器打开 `http://服务器IP:4000`，输入 AUTH_CODE
2. 「账号管理」→ 添加账号 → 扫码登录微信读书（不要勾自动退出）
3. 「订阅源」→ 添加 → 粘贴任意一篇公众号文章链接，各加两次（两个号）
4. 等待几分钟后验证：
   ```bash
   curl http://服务器IP:4000/feeds/all.json
   ```
   返回 JSON 即成功。

## 3. 接入 GitHub

1. 仓库 → Settings → Secrets → Actions → New repository secret
   - Name: `WEWE_RSS_ORIGIN`
   - Value: `http://你的服务器IP:4000`
2. 代码已包含 `site/fetch_wechat.mjs` 和 workflow 支持，推送代码后 CI 自动生效。

## 4. 日常

- 新文章发布后，最多 6 小时内进站
- 公众号账号失效时回到 wewe-rss 重新扫码
- 服务器挂掉时站点不受影响（只用它抓取）

