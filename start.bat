@echo off
REM Avvia WebBuilder su Windows (doppio click su questo file)
cd /d "%~dp0"

where node >nul 2>nul
if %errorlevel%==0 (
    node serve.js
    goto :end
)

where python >nul 2>nul
if %errorlevel%==0 (
    echo Avvio con Python...
    start "" http://localhost:8000
    python -m http.server 8000
    goto :end
)

where py >nul 2>nul
if %errorlevel%==0 (
    echo Avvio con Python...
    start "" http://localhost:8000
    py -m http.server 8000
    goto :end
)

echo [!] Nessun runtime trovato.
echo     Installa Node.js (https://nodejs.org) oppure Python (https://python.org)
pause

:end
pause
