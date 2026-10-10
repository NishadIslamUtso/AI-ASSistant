@echo off
setlocal
REM Developer source export from a reviewed Git checkout, not a private-vault backup.
REM App launch from a downloaded ZIP does not require Git or this script.
cd /d "%~dp0.."
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is required for source packaging.
  pause
  exit /b 1
)
node scripts\package-source.cjs %*
if errorlevel 1 (
  pause
  exit /b 1
)
echo Source ZIP created. This did not upload anything.
pause
exit /b 0
