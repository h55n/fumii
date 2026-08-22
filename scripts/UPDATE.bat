@echo off
title fumii — Building Update...
color 0A

echo.
echo  ========================================
echo     fumii -- Build ^& Launch
echo     This window will close when done
echo  ========================================
echo.

cd /d "%~dp0"

:: ── STEP 1: Kill any running instances ───────────────────────────────────────
echo [1/5] Stopping previous fumii...
taskkill /F /IM fumii.exe /T >nul 2>&1
powershell -Command "Get-Process -Name 'fumii','electron' -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue" >nul 2>&1
ping 127.0.0.1 -n 3 >nul

:: ── STEP 2: Clean lock files ──────────────────────────────────────────────────
echo [2/5] Cleaning lock files...
powershell -Command "Remove-Item -Path \"$env:APPDATA\fumii\Singleton*\",\"$env:APPDATA\fumii\lockfile\",\"$env:APPDATA\fumii\DevToolsActivePort\" -Force -ErrorAction SilentlyContinue" >nul 2>&1

:: ── STEP 3: Compile (TypeScript + Vite) ──────────────────────────────────────
echo [3/5] Compiling source code...
call npm run build
if errorlevel 1 (
    echo.
    echo  !! BUILD FAILED -- Check errors above !!
    pause
    exit /b 1
)
echo     Build OK

:: ── STEP 4: Package ───────────────────────────────────────────────────────────
echo [4/5] Packaging app...
call npx electron-builder --win --dir --config.directories.output="release-fixed"
if errorlevel 1 (
    echo  !! PACKAGE FAILED !!
    pause
    exit /b 1
)
call node scripts/patch-exe-metadata.js
echo     Package OK

:: ── STEP 5: Launch ───────────────────────────────────────────────────────────
echo [5/5] Launching fumii...
powershell -Command "Remove-Item -Path \"$env:APPDATA\fumii\Singleton*\",\"$env:APPDATA\fumii\lockfile\",\"$env:APPDATA\fumii\DevToolsActivePort\" -Force -ErrorAction SilentlyContinue" >nul 2>&1
start "" "release-fixed\win-unpacked\fumii.exe"

echo.
echo  Done! fumii is now open.
ping 127.0.0.1 -n 3 >nul
