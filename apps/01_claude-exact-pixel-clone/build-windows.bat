@echo off
title AI ASSistant - local build
cd /d "%~dp0"

echo Building AI ASSistant into preview-dist\ for the local proxy-backed preview server.
echo The server binds to 127.0.0.1 by default and does not contact a cloud service.
echo.

if not exist "node_modules" (
  echo [..] installing local app dependencies
  call npm install
  if errorlevel 1 goto failed
)

echo [..] ensuring the Windows Rollup binary is present
call npm install @rollup/rollup-win32-x64-msvc --save-optional
if errorlevel 1 goto failed

echo [..] building the local preview bundle
call npm run build:preview
if errorlevel 1 goto failed

echo.
echo [ok] built into preview-dist\
echo      Start the local app with:  node server\preview-server.cjs
echo      Then open: http://127.0.0.1:4173
echo      The app proxies only approved local Ollama and vault endpoints.
echo.
pause
exit /b 0

:failed
echo.
echo [X] build failed - scroll up for the error
echo.
pause
exit /b 1
