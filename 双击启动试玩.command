#!/bin/bash
# 双击启动《不烧心小馆》浏览器试玩（macOS）。关闭此终端窗口即停止服务。
cd "$(dirname "$0")"
NODE="$(command -v node)"
if [ -z "$NODE" ]; then NODE="/Users/msj/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"; fi
if [ ! -x "$NODE" ]; then echo "找不到 Node.js，请先安装：https://nodejs.org"; read -n 1; exit 1; fi
lsof -ti tcp:4173 >/dev/null 2>&1 || ("$NODE" tools/serve.js >/tmp/bushaoxin-serve.log 2>&1 &)
sleep 1
open "http://127.0.0.1:4173"
echo "试玩地址：http://127.0.0.1:4173 （加 ?dev 显示调试信息）"
echo "关闭这个窗口即停止。"
wait
