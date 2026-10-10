@echo off
title AI ASSistant
echo AI ASSistant - Claude-style local app (Ollama + Obsidian vault)
echo.

where ollama >nul 2>&1
if errorlevel 1 (
  echo [!] Ollama is not installed or not in PATH.
  echo     Install it from https://ollama.com then run this file again.
  pause
  exit /b 1
)

curl -s http://127.0.0.1:11434/api/tags >nul 2>&1
if errorlevel 1 (
  echo Starting Ollama in a new window...
  start "Ollama" cmd /k "ollama serve"
  timeout /t 4 >nul
) else (
  echo Ollama is already running - using it.
)

ollama list | findstr /i "qwen2.5:3b" >nul
if errorlevel 1 (
  echo [!] qwen2.5:3b was not found. The app still starts; pick another model in the composer,
  echo     or run: ollama pull qwen2.5:3b
)

cd /d "%~dp0"
if not exist "node_modules" call npm install

start "Vault API" cmd /k "node server\vault-api.cjs"
timeout /t 2 >nul

echo.
echo Open http://127.0.0.1:5173 in your browser when Vite says it is ready.
call npx vite --host 127.0.0.1 --port 5173
pause
