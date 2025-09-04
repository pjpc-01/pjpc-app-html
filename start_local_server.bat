@echo off
echo Starting local PocketBase server...
echo.

REM Check if PocketBase is installed
where pocketbase >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo PocketBase is not installed or not in PATH
    echo Please download PocketBase from: https://pocketbase.io/docs/
    echo.
    echo Or use the web version at: http://localhost:8090
    pause
    exit /b 1
)

REM Start PocketBase server
echo Starting PocketBase on http://localhost:8090
echo Press Ctrl+C to stop the server
echo.
pocketbase serve --http=localhost:8090

pause
