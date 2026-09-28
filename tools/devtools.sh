#!/usr/bin/env bash
# devtools.sh —— 微信开发者工具 CLI 包装
# 用法：
#   devtools.sh open                          打开项目
#   devtools.sh auto [port]                   启动自动化端口（默认 9421）
#   devtools.sh upload <version> <desc>       上传体验版
#   devtools.sh preview [qr.png]              真机预览，二维码落盘（默认 ./preview-qr.png）
#   devtools.sh deploy-fn <fnName> <envId>    部署云函数（云端装依赖）
#   devtools.sh health                        端口健康检查
# 环境变量：DEVTOOLS、PROJ 可覆盖默认值
set -euo pipefail

DEVTOOLS="${DEVTOOLS:-/Applications/wechatwebdevtools.app/Contents/MacOS/cli}"
PROJ="${PROJ:-$PWD}"

cmd="${1:-}"; [ -n "$cmd" ] || { sed -n '2,12p' "$0"; exit 1; }
shift

case "$cmd" in
  open)
    exec "$DEVTOOLS" open --project "$PROJ" ;;
  auto)
    PORT="${1:-9421}"
    exec "$DEVTOOLS" auto --project "$PROJ" --auto-port "$PORT" ;;
  upload)
    VER="${1:?usage: devtools.sh upload <version> <desc>}"; shift
    DESC="${1:-}"
    exec "$DEVTOOLS" upload --project "$PROJ" -v "$VER" -d "$DESC" ;;
  preview)
    OUT="${1:-./preview-qr.png}"
    exec "$DEVTOOLS" preview --project "$PROJ" --qr-format image --qr-output "$OUT" ;;
  deploy-fn)
    FN="${1:?usage: devtools.sh deploy-fn <fnName> <envId>}"
    ENV_ID="${2:?usage: devtools.sh deploy-fn <fnName> <envId>}"
    exec "$DEVTOOLS" cloud functions deploy --project "$PROJ" --env "$ENV_ID" --names "$FN" --remote-npm-install ;;
  health)
    echo "== IDE 服务端口 36354 ==";  lsof -nP -i :36354 || echo "(未启动：跑一次任意 cli 命令即可拉起；若持续失败检查 设置→安全设置→服务端口)"
    echo "== automator 9421 ==";     lsof -nP -i :9421  || echo "(未启动：devtools.sh auto)" ;;
  *)
    sed -n '2,12p' "$0"; exit 1 ;;
esac
