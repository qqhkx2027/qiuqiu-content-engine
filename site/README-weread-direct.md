# 微信公众号自动更新接入说明（微信读书官方直连）

目标：让「秋秋很开心」「秋秋在分享」的新文章自动进入本站，不依赖任何第三方转发服务。

## 架构

微信读书（官方 weread.qq.com）→ Cookie 直连 → GitHub Actions 定时拉取 → 转 Markdown 入库 → 自动构建发布 GitHub Pages

这就是把 [zhaohongxuan/obsidian-weread-plugin](https://github.com/zhaohongxuan/obsidian-weread-plugin) 的实现思路（Cookie 直连官方接口，不经过第三方）搬到了站点管线里：

- 书架里 type=3 的记录就是公众号文章
- 文章链接是 mp.weixin.qq.com/s/<id>，正文直接抓微信原文网页
- 全程不走 wewe-rss / 第三方转发，不受转发服务 502 影响

## 你需要做的两件事

### 1. 在微信读书里订阅这两个公众号

1. 打开微信读书 App（或网页版 weread.qq.com）
2. 搜索「秋秋很开心」，点「关注/加入书架」
3. 搜索「秋秋在分享」，同样收藏
4. 之后公众号每次发文，微信读书会自动把文章收进书架（延迟几分钟到几小时不等）

> 注意：文章必须出现在你的微信读书书架上，脚本才能抓到。

### 2. 把 Cookie 填入 GitHub Secret

1. 用 Chrome 打开 https://weread.qq.com，微信扫码登录
2. 按 F12 打开开发者工具 → Console 输入：
   document.cookie
3. 复制输出的 Cookie 字符串（wr_vid=...; wr_skey=... 开头的整段）
4. 打开仓库 Settings → Secrets and variables → Actions → New repository secret
   - Name: WEREAD_COOKIE
   - Value: 粘贴刚复制的 Cookie（不要带引号，不要换行）

> Cookie 通常在 1~3 个月后过期，过期后重新登录微信读书再复制一次即可。

## 验证与日常

- 推送代码后，Actions 会跑 node site/fetch_weread_direct.mjs；
- 也可以在本地验证：
WEREAD_COOKIE="wr_vid=...; wr_skey=..." node site/fetch_weread_direct.mjs
- 新文章发布后，最多 1 天内进站（GitHub Actions 每天 01:00 UTC 自动跑）
- 如果某篇文章没抓到，先在微信读书书架确认它已出现，再手动触发一次 workflow（Actions → Run workflow）

## 常见问题

- 书架里看不到公众号文章：先确认已在微信读书里订阅/收藏该公众号，等待同步
- 浏览器控制台 document.cookie 为空：需要先在 www.weread.qq.com 登录一次（不是 m.weread.qq.com）
- Cookie 失效（报 -2012 / 401）：重新扫码登录，再复制一次 Cookie 更新 Secret
- 正文抓不到（mp.weixin.qq.com 反爬）：脚本已带微信 UA，偶尔失败会自动跳过，下一轮重试

> 不再需要服务器、不再需要 wewe-rss；旧的 wewe-rss 配置（WEWE_RSS_ORIGIN / fetch_wechat.mjs / setup-wewe-rss.sh）可以停用或删除。
