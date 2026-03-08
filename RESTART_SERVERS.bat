@echo off
echo Stopping all Node.js processes...
taskkill /F /IM node.exe 2>nul

echo.
echo Waiting 2 seconds...
timeout /t 2 /nobreak >nul

echo.
echo Starting backend server...
start "Backend Server" cmd /k "cd backend && npm run dev"

echo.
echo Waiting 3 seconds for backend to start...
timeout /t 3 /nobreak >nul

echo.
echo Starting frontend dev server...
start "Frontend Server" cmd /k "npm run dev:frontend"

echo.
echo ========================================
echo Both servers starting!
echo Backend: http://localhost:5000
echo Frontend: http://localhost:8080
echo ========================================
