@echo off
setlocal
title AI ASSistant Exact Claude
echo Evening, Utso - AI ASSistant local chat
echo Uses your installed Ollama model; it does not download a model.
echo.
where ollama >nul 2>&1 || (echo Ollama was not found. Install Ollama separately, then try again. & pause & exit /b 1)
ollama list | findstr /i "qwen2.5:3b" >nul || (echo qwen2.5:3b was not found. No model was downloaded. & ollama list & pause & exit /b 1)
curl -fsS http://127.0.0.1:11434/api/tags >nul 2>&1 || start "Ollama" cmd /k "ollama serve"
cd /d "%~dp0"
if not exist "node_modules\vite\bin\vite.js" call npm install --no-audit --no-fund
if errorlevel 1 (echo Dependency installation failed. & pause & exit /b 1)
curl -fsS http://127.0.0.1:8765/ >nul 2>&1
if errorlevel 1 start "Vault API" /D "%~dp0" cmd /k node server\vault-api.cjs
timeout /t 2 >nul
call npx vite --host 127.0.0.1 --port 5173
pause
