@echo off
setlocal
cd /d "%~dp0"

echo [1/3] Starting Excel Data Analyzer (EDA) Services...
echo Port Configuration:
echo - Frontend: 4002
echo - Backend:  4444

:: Start Backend in the background
echo [2/3] Initializing Backend Server...
cd backend
if not exist node_modules (
    echo [INFO] Backend node_modules not found. Installing...
    call npm install
)
start "EDA Backend" /min cmd /c "npm run dev"
cd ..

:: Start Frontend (Next.js) in the background
echo [3/3] Initializing Frontend Server (Next.js)...
if not exist node_modules (
    echo [INFO] Frontend node_modules not found. Installing...
    call npm install
)
:: Use -p to set the port for Next.js
start "EDA Frontend" /min cmd /c "npm run dev -- -p 4002"

echo.
echo ======================================================
echo  EDA Services are running in the background!
echo  - Frontend: http://localhost:4002
echo  - Backend:  http://localhost:4444/api/health
echo ======================================================
echo To stop servers, run: stop_server.bat
echo.
pause
