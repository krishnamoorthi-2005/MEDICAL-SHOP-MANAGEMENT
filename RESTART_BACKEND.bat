@echo off
echo ========================================
echo Restarting Backend Server
echo ========================================
echo.

echo Stopping existing backend...
taskkill /F /IM node.exe /FI "WINDOWTITLE eq Backend Server*" 2>nul

cd backend

echo.
echo Starting backend with updated credentials...
echo.
start "Backend Server" cmd /k "npm run dev"

echo.
echo ========================================
echo Backend restarted!
echo Check the Backend Server window for logs
echo ========================================
echo.
pause
