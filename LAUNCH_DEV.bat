@echo off
title fumii — Live Development Mode
color 0B
echo.
echo  ========================================
echo     fumii -- Live Development Mode
echo  ========================================
echo.

cd /d "%~dp0"

echo [1/3] Stopping previous instances...
taskkill /F /IM fumii.exe /T >nul 2>&1
taskkill /F /IM electron.exe /T >nul 2>&1
powershell -Command "Get-Process -Name 'fumii','electron' -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue" >nul 2>&1
ping 127.0.0.1 -n 2 >nul

echo [2/3] Cleaning stale lock files...
powershell -Command "Remove-Item -Path \"$env:APPDATA\fumii\Singleton*\",\"$env:APPDATA\fumii\lockfile\",\"$env:APPDATA\fumii\DevToolsActivePort\" -Force -ErrorAction SilentlyContinue" >nul 2>&1

echo [3/3] Starting Electron dev server...
npm run dev
