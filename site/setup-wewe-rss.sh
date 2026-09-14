#!/usr/bin/env bash
# WeWe-RSS 一键部署
set -euo pipefail
echo "== [1/5] 检查 Docker =="
if ! command -v docker >/dev/null 2>&1; then
  echo "未安装 Docker，开始安装..."
  curl -fsSL https://get.docker.com | sudo sh
fi
sudo systemctl enable --now docker >/dev/null 2>&1 || sudo service docker start >/dev/null 2>&1 || true
echo "== [2/5] 修复 Docker 权限 =="
CUR="$(id -un)"
if ! id -nG "$CUR" | grep -qw docker; then
  sudo usermod -aG docker "$CUR" || sudo gpasswd -a "$CUR" docker
  echo "已将 $CUR 加入 docker 组；请新开一个 SSH 连接后再继续"
fi
echo "== [3/5] 输入配置 =="
read -rp "AUTH_CODE（登录密码，回车用默认 qiqu2026）: " AUTH
AUTH="${AUTH:-qiqu2026}"
read -rp "服务器公网IP（回车自动检测）: " IP
if [ -z "$IP" ]; then IP=$(curl -s -m 5 ifconfig.me 2>/dev/null || true); fi
if [ -z "$IP" ]; then echo "!! 自动检测失败，请重启脚本手动填IP"; exit 1; fi
echo "== [4/5] 启动容器 =="
mkdir -p "$HOME/wewe-rss/data" && cd "$HOME/wewe-rss"
sudo docker rm -f wewe-rss 2>/dev/null || true
sudo docker run -d --name wewe-rss --restart unless-stopped -p 4000:4000 \
  -e DATABASE_TYPE=sqlite -e AUTH_CODE="$AUTH" -e SERVER_ORIGIN_URL="http://$IP:4000" \
  -e CRON_EXPRESSION="0 */6 * * *" -e FEED_MODE=fulltext -v "$(pwd)/data:/app/data" \
  cooderl/wewe-rss-sqlite:latest
echo "== [5/5] 完成 =="
sleep 8
sudo docker ps --filter name=wewe-rss --format "状态: {{.Status}}"
echo "浏览器打开: http://$IP:4000 （密码: $AUTH）"
