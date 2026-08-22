@echo off
title fumii — Desktop Companion
echo.
echo  ========================================
echo     fumii -- Desktop Companion
echo  ========================================
echo.

cd /d "%~dp0"

echo [1/4] Stopping previous fumii instances...
taskkill /F /IM fumii.exe /T >nul 2>&1
powershell -Command "Get-Process -Name 'fumii','electron' -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue" >nul 2>&1
ping 127.0.0.1 -n 3 >nul

echo [2/4] Cleaning lock files...
powershell -Command "Remove-Item -Path \"$env:APPDATA\fumii\Singleton*\",\"$env:APPDATA\fumii\lockfile\",\"$env:APPDATA\fumii\DevToolsActivePort\" -Force -ErrorAction SilentlyContinue" >nul 2>&1

echo [3/4] Launching fumii...
if exist "release-fixed\win-unpacked\fumii.exe" (
    start "" "release-fixed\win-unpacked\fumii.exe"
    echo OK: fumii is open!
) else if exist "release\win-unpacked\fumii.exe" (
    start "" "release\win-unpacked\fumii.exe"
    echo OK: fumii is open!
) else (
    npm run dev
)

ping 127.0.0.1 -n 2 >nul
