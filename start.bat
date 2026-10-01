@echo off
title Finger Portal

cd /d "%~dp0"

echo ========================================
echo        FINGER PORTAL
echo ========================================
echo.
echo Starting local server...
echo.

start "" "http://127.0.0.1:8000"

python -m http.server 8000

pause