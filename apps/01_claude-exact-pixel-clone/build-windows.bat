@echo off
setlocal
title Build AI ASSistant
cd /d "%~dp0"
where node >nul 2>&1 || (echo Node.js was not found. Install Node.js LTS separately, then try again. & pause & exit /b 1)
if not exist "node_modules\vite\bin\vite.js" call npm install --no-audit --no-fund
if errorlevel 1 (echo Dependency installation failed. & pause & exit /b 1)
call npx vite build
if errorlevel 1 (echo Build failed. Review the error above. & pause & exit /b 1)
echo Build complete: dist\
pause
