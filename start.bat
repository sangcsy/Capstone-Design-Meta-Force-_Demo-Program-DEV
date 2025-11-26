@echo off
title ML Demo Program Launcher
echo ========================================
echo  ML Demo Program - Auto Launcher
echo ========================================
echo.
echo Starting Python Backend Server...
start "Python Backend" cmd /k "cd /d %~dp0 && python backend/app.py"
timeout /t 3 /nobreak >nul

echo Starting React Frontend...
start "React Frontend" cmd /k "cd /d %~dp0 && npm start"

echo.
echo ========================================
echo  Both servers are starting!
echo  - Python Backend: http://localhost:5000
echo  - React Frontend: http://localhost:3000
echo ========================================
echo.
echo Press any key to exit this launcher window...
pause >nul
exit
