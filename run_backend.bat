@echo off
setlocal enabledelayedexpansion

echo =======================================================
echo   Chips MRP - Starting Python Flask Backend
echo   Single Authority for Database & Analytics
echo =======================================================

cd /d "%~dp0backend"

:: Check if Python is installed
where python >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Python is not installed or not found in system PATH.
    echo Please install Python 3.10+ from https://www.python.org/
    pause
    exit /b 1
)

:: Create virtual environment if it does not exist
if not exist "venv" (
    echo [INFO] Virtual environment 'venv' not found. Creating virtual environment...
    python -m venv venv
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Failed to create virtual environment.
        pause
        exit /b 1
    )
    echo [INFO] Virtual environment created successfully.
)

:: Activate virtual environment
call venv\Scripts\activate.bat

:: Install dependencies if requirements.txt is newer or packages missing
echo [INFO] Verifying Python dependencies...
python -m pip install --quiet --upgrade pip
python -m pip install --quiet -r requirements.txt
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to install backend requirements.
    pause
    exit /b 1
)

:: Verify database file presence
if not exist "database\chips_mrp.db" (
    if exist "..\chips_mrp.db" (
        echo [INFO] Found database in project root. Copying to backend\database\chips_mrp.db...
        if not exist "database" mkdir database
        copy /y "..\chips_mrp.db" "database\chips_mrp.db" >nul
    ) else (
        echo [WARNING] No database found at backend\database\chips_mrp.db!
        echo Please ensure chips_mrp.db is present before running production tasks.
    )
)

echo [INFO] Starting Flask Backend on http://127.0.0.1:5000 ...
python app.py

pause
