@echo off
setlocal
cd /d "%~dp0"
if exist "%~dp0release\win-unpacked\Dreko Translation.exe" (
  start "" "%~dp0release\win-unpacked\Dreko Translation.exe"
) else if exist "node_modules\electron\dist\electron.exe" (
  call "node_modules\.bin\electron.cmd" .
) else (
  echo The desktop app has not been built yet.
  echo Run npm install and npm run dist, or install the Dreko Translation setup file.
  pause
)
