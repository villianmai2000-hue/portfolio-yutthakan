@echo off
set "PATH=%PATH%;C:\Program Files\Git\cmd;C:\Program Files\Git\bin"
cd /d "%~dp0"

echo ========================================================
echo   Uploading Portfolio to GitHub...
echo ========================================================
echo.

git push -u origin main

echo.
echo ========================================================
echo   Done!
echo ========================================================
echo.
pause
