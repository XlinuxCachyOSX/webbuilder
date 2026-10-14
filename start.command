#!/usr/bin/env bash
# Doppio click su macOS per avviare WebBuilder
cd "$(dirname "$0")"

if command -v node >/dev/null 2>&1; then
    exec node serve.js
fi

if command -v python3 >/dev/null 2>&1; then
    (sleep 1; open http://localhost:8000) || true
    echo "In esecuzione su http://localhost:8000 (Ctrl+C per fermare)"
    exec python3 -m http.server 8000
fi

echo "Installa Node.js (https://nodejs.org) oppure Python 3"
read -r -p "Premi Invio per chiudere..."
exit 1
