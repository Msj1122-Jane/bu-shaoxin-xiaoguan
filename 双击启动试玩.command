#!/bin/zsh

set -e
BSX_DIR="${0:A:h}"
BSX_NODE="/Users/msj/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
BSX_URL="http://127.0.0.1:4173/"

cd "$BSX_DIR"

if ! /usr/bin/curl --silent --fail --max-time 1 "$BSX_URL" >/dev/null 2>&1; then
  "$BSX_NODE" tools/serve.js &
  BSX_SERVER_PID=$!
  for BSX_ATTEMPT in 1 2 3 4 5; do
    /usr/bin/curl --silent --fail --max-time 1 "$BSX_URL" >/dev/null 2>&1 && break
    /bin/sleep 0.3
  done
fi

/usr/bin/open "$BSX_URL"
echo "《不烧心小馆》试玩已打开。这个窗口保持开启时，本地试玩服务会保持运行。"
wait "${BSX_SERVER_PID:-}" 2>/dev/null || true
