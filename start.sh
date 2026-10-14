#!/usr/bin/env bash
# Avvia WebBuilder su Linux e macOS
set -e
cd "$(dirname "$0")"

if command -v node >/dev/null 2>&1; then
    exec node serve.js
fi

if command -v python3 >/dev/null 2>&1; then
    (sleep 1; xdg-open http://localhost:8000 2>/dev/null || open http://localhost:8000 2>/dev/null) || true
    echo "In esecuzione su http://localhost:8000 (Ctrl+C per fermare)"
    exec python3 -m http.server 8000
fi

echo "[!] Installa Node.js (https://nodejs.org) oppure Python 3 (https://python.org)"
exit 1
