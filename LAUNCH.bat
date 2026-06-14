@echo off
title fumii — Setup and Launch
echo.
echo  +======================================+
echo  |  fumii -- Install and Launch         |
echo  +======================================+
echo.

cd /d "f:\ANTIGRAVITY\fumii"
if errorlevel 1 (
    echo ERROR: Could not navigate to f:\ANTIGRAVITY\fumii
    pause
    exit /b 1
)

echo [1/2] Installing dependencies (marked, dompurify, and all others)...
echo       (this may take 2-5 min for native addons)
echo.
npm install
if errorlevel 1 (
    echo.
    echo ERROR: npm install failed.
    echo If you see node-gyp errors, ensure Visual Studio Build Tools are installed.
    echo   winget install Microsoft.VisualStudio.2022.BuildTools
    pause
    exit /b 1
)

echo.
echo [2/2] Starting fumii...
echo.
npm run dev
pause
