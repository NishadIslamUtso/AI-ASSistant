@echo off
setlocal
cd /d "%~dp0"
title AI ASSistant - build web app
where node >nul 2>&1
if errorlevel 1 (echo Node.js 18 or newer is required. & pause & exit /b 1)
node server\check-deps.cjs >nul 2>&1
if errorlevel 1 (
  if exist package-lock.json (call npm ci --include=optional --no-audit --no-fund) else (call npm install --include=optional --no-audit --no-fund)
  if errorlevel 1 (pause & exit /b 1)
  if not exist "node_modules\@rollup\rollup-win32-x64-msvc" (
    for /f %%v in ('node -p "require('./node_modules/rollup/package.json').version"') do call npm install --no-save --include=optional @rollup/rollup-win32-x64-msvc@%%v
    if errorlevel 1 (pause & exit /b 1)
  )
  node server\check-deps.cjs --record
  if errorlevel 1 (pause & exit /b 1)
)
call npm run build
if errorlevel 1 (echo Build failed. & pause & exit /b 1)
echo.
echo Built dist\ successfully. This is a web build, not a Windows installer.
echo To use it with local API proxies: npm run preview -- --host 127.0.0.1
pause
endlocal
