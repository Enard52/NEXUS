@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo NEXUS tasarim duzeltmeleri - son adimlar
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\ui-fix-finalize.ps1"
echo.
pause
