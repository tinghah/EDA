@echo off
setlocal
cd /d "%~dp0"

echo [1/2] Terminating EDA Services...
echo Stopping Frontend (Port 4002) and Backend (Port 4444)...

:: Port 4002 (Frontend)
set "PORT=4002"
for /f "tokens=5" %%a in ('netstat -aon ^| findstr /r ":%PORT%[ ]*.*LISTENING"') do (
    echo [INFO] Found PID %%a on port %PORT%. Terminating...
    taskkill /f /pid %%a
)

:: Port 4444 (Backend)
set "PORT=4444"
for /f "tokens=5" %%a in ('netstat -aon ^| findstr /r ":%PORT%[ ]*.*LISTENING"') do (
    echo [INFO] Found PID %%a on port %PORT%. Terminating...
    taskkill /f /pid %%a
)

echo.
echo [2/2] Cleanup Complete.
echo ======================================================
echo  All EDA services have been stopped.
echo ======================================================
echo.
pause
