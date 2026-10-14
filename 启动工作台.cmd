@echo off
setlocal
cd /d "%~dp0"
where node.exe >nul 2>nul
if not errorlevel 1 goto node_ready
if exist "%ProgramFiles%\nodejs\node.exe" set "PATH=%ProgramFiles%\nodejs;%PATH%"
if exist "D:\Program Files\nodejs\node.exe" set "PATH=D:\Program Files\nodejs;%PATH%"
if exist "%LocalAppData%\Programs\nodejs\node.exe" set "PATH=%LocalAppData%\Programs\nodejs;%PATH%"
where node.exe >nul 2>nul
if errorlevel 1 goto missing_node

:node_ready
where npm.cmd >nul 2>nul
if errorlevel 1 goto missing_npm
echo PinBean Studio - local workspace
call node.exe --version
call npm.cmd --version
if /i "%~1"=="--check" goto check_ready
if exist "node_modules\vite\bin\vite.js" goto start_app
echo Installing dependencies. Internet access is needed for this step.
call npm.cmd ci
if errorlevel 1 goto install_failed

:start_app
echo Starting PinBean. Keep this window open while using the app.
echo Open the Local URL shown below. Press Ctrl+C to stop.
if /i "%~1"=="--no-open" goto start_without_browser
call npm.cmd run dev -- --open
goto finished

:start_without_browser
call npm.cmd run dev
goto finished

:check_ready
if not exist "node_modules\vite\bin\vite.js" echo Dependencies will be installed on first launch.
echo Launcher check passed.
exit /b 0

:missing_node
echo Node.js was not found. Install Node.js 22.12+ or 24 LTS, then retry.
goto failed

:missing_npm
echo npm.cmd was not found. Repair your Node.js installation, then retry.
goto failed

:install_failed
echo Dependency installation failed. Check the network and the errors above.
goto failed

:failed
if /i "%~1"=="--check" exit /b 1
pause
exit /b 1

:finished
pause
