@echo off
setlocal enabledelayedexpansion

echo =======================================================
echo   Chips MRP - Starting React + Vite Frontend
echo =======================================================

cd /d "%~dp0frontend"

:: Check if Node is installed
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not installed or not found in system PATH.
    echo Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)

:: Install npm packages if node_modules does not exist
if not exist "node_modules" (
    echo [INFO] Installing frontend dependencies via npm...
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] npm install failed.
        pause
        exit /b 1
    )
)

:: Start Vite dev server
echo [INFO] Starting Vite development server...
call npm run dev

pause
