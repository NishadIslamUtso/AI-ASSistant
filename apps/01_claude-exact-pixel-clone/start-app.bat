@echo off
setlocal
cd /d "%~dp0"
title AI ASSistant - Claude layout / local Ollama

echo AI ASSistant - using your existing qwen2.5:3b, no model download.
echo Canonical vault: ..\..\vault\AI-Brain
echo.
where node >nul 2>&1
if errorlevel 1 (echo Node.js 18 or newer is required. & pause & exit /b 1)
node -e "if (Number(process.versions.node.split('.')[0]) < 18) process.exit(1)"
if errorlevel 1 (echo Please use Node.js 18 or newer. & pause & exit /b 1)
where npm >nul 2>&1
if errorlevel 1 (echo npm is not on PATH. & pause & exit /b 1)

node server\check-deps.cjs >nul 2>&1
if errorlevel 1 (
  echo Installing app dependencies only. No models or native build tools.
  if exist package-lock.json (call npm ci --include=optional --no-audit --no-fund) else (call npm install --include=optional --no-audit --no-fund)
  if errorlevel 1 (echo Dependency install failed. & pause & exit /b 1)
  if not exist "node_modules\@rollup\rollup-win32-x64-msvc" (
    for /f %%v in ('node -p "require('./node_modules/rollup/package.json').version"') do call npm install --no-save --include=optional @rollup/rollup-win32-x64-msvc@%%v
    if errorlevel 1 (echo Windows Rollup dependency failed. & pause & exit /b 1)
  )
  node server\check-deps.cjs --record
  if errorlevel 1 (echo Dependencies are incomplete. & pause & exit /b 1)
)

node server\check-service.cjs ollama >nul 2>&1
if not errorlevel 1 goto ollama_ready
where ollama >nul 2>&1
if errorlevel 1 (echo Ollama is not running and is not on PATH. Start your existing Ollama app first. & pause & exit /b 1)
echo Starting your existing Ollama installation...
start "Ollama" cmd /k "ollama serve"
for /l %%n in (1,1,10) do (
  timeout /t 2 /nobreak >nul
  node server\check-service.cjs ollama >nul 2>&1
  if not errorlevel 1 goto ollama_ready
)
echo Ollama did not become ready. Check the Ollama terminal.
pause
exit /b 1

:ollama_ready
node server\check-service.cjs model
if errorlevel 1 (pause & exit /b 1)
rem Relative Vite proxies avoid Ollama CORS; do not kill an existing Ollama or set wildcard origins.

node server\check-service.cjs vault >nul 2>&1
if not errorlevel 1 goto vault_ready
curl --silent --fail --max-time 2 http://127.0.0.1:8765/ >nul 2>&1
if not errorlevel 1 (echo Port 8765 is already serving a different vault/API. Close that terminal and retry. & pause & exit /b 1)
start "AI ASSistant Vault" cmd /k "node server\vault-api.cjs"
for /l %%n in (1,1,10) do (
  timeout /t 1 /nobreak >nul
  node server\check-service.cjs vault >nul 2>&1
  if not errorlevel 1 goto vault_ready
)
echo Vault could not start. Check the Vault terminal; an existing vault is required.
pause
exit /b 1

:vault_ready
node server\check-service.cjs vault
echo.
echo Open http://127.0.0.1:5173 after Vite says ready.
echo Keep this window and the Vault terminal open. Close them when finished.
call npm run dev -- --host 127.0.0.1
if errorlevel 1 (echo App could not start. Port 5173 may already be in use. & pause & exit /b 1)
endlocal
