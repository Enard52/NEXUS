@echo off
cd /d "%~dp0"
echo NEXUS - GitHub gonderimi
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\github-push.ps1"
echo.
echo Bitti. Bu pencereyi kapatabilirsin.
pause
