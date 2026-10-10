@echo off
title AI ASSistant Exact Claude
echo Evening, Utso - Exact clone from your screenshots
echo Using qwen2.5:3b directly
echo.
where ollama >nul 2>&1 || (echo Ollama not found & pause & exit /b 1)
ollama list | findstr /i "qwen2.5:3b" >nul || (echo qwen2.5:3b not found & ollama list & pause & exit /b 1)
curl -s http://127.0.0.1:11434/api/tags >nul 2>&1 || start "Ollama" cmd /k "ollama serve"
cd /d %~dp0
if not exist "node_modules" call npm install
start "Vault API" cmd /k "node server\vault-api.cjs"
timeout /t 2 >nul
call npx vite --host 127.0.0.1 --port 5173
pause
