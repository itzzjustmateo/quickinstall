@echo off
REM Create a blueprint zip for Pterodactyl QuickInstall extension

REM Get the directory where this script is located
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

REM Create the zip using PowerShell (built into Windows)
powershell -Command "Compress-Archive -Path 'app','conf.yml','routes','resources' -DestinationPath 'quickinstall.zip' -Force"

if exist quickinstall.zip (
    echo Created quickinstall.zip
    echo User action required to make it .blueprint format
) else (
    echo Failed to create zip
)
