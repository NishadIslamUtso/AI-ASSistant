@echo off
title AI ASSistant - Local Claude Layout
setlocal

echo Starting AI ASSistant (local Ollama + local vault API)
echo.

where node >nul 2>&1 || (echo Node.js was not found. Install Node.js LTS, then run this file again. & pause & exit /b 1)
where npm >nul 2>&1 || (echo npm was not found. Repair the Node.js installation, then run this file again. & pause & exit /b 1)
where ollama >nul 2>&1 || (echo Ollama was not found. Install/start Ollama first. & pause & exit /b 1)

curl -fsS http://127.0.0.1:11434/api/tags >nul 2>&1
if errorlevel 1 (
  echo Ollama is not responding. Starting ollama serve in a separate window...
  start "Ollama" cmd /k "ollama serve"
  timeout /t 3 >nul
)

cd /d "%~dp0"
if not exist "node_modules" (
  echo Installing app dependencies. This may take a while the first time...
  call npm install
  if errorlevel 1 (echo Dependency installation failed. & pause & exit /b 1)
)
if not exist "node_modules\@rollup\rollup-win32-x64-msvc" (
  echo Installing the optional Windows Rollup package if npm did not provide it...
  call npm install --no-save @rollup/rollup-win32-x64-msvc
  if errorlevel 1 (echo Rollup package install failed. & pause & exit /b 1)
)

netstat -ano | findstr ":8765" | findstr "LISTENING" >nul
if errorlevel 1 (
  echo Starting the local AI-Brain vault API on 127.0.0.1:8765...
  start "AI ASSistant Vault API" /D "%~dp0" cmd /k "node server\vault-api.cjs"
  timeout /t 2 >nul
) else (
  echo Vault API already running on port 8765.
)

echo.
echo Open http://127.0.0.1:5173 after Vite starts.
echo Chat and model-list requests are proxied locally; Ollama data is not sent to a cloud model.
echo Press Ctrl+C in this window to stop the app.
echo.
call npx vite --host 127.0.0.1 --port 5173 --strictPort
pause
