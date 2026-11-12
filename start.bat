@echo off
setlocal

echo =======================================================
echo   Chips MRP - Plug-and-Play Launch Suite
echo   Backend: Python Flask (Port 5000)
echo   Frontend: React + Vite (Port 5173 / 3000)
echo =======================================================

echo [1/2] Launching Python Flask Backend window...
start "Chips MRP - Backend (Flask)" cmd /k "run_backend.bat"

echo [2/2] Launching React Vite Frontend window...
start "Chips MRP - Frontend (Vite)" cmd /k "run_frontend.bat"

echo.
echo Both applications are launching.
echo Backend API:  http://localhost:5000/api/health
echo Frontend App: http://localhost:5173
echo.
echo You may close this launcher window at any time.
