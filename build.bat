@echo off
REM Create a blueprint zip for Pterodactyl QuickInstall extension

REM Get the directory where this script is located
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

REM Remove old build if exists
if exist quickinstall.blueprint del quickinstall.blueprint
if exist quickinstall.zip del quickinstall.zip

REM Create the zip using PowerShell (create as .zip first)
powershell -Command "Compress-Archive -Path 'app','conf.yml','routes','resources' -DestinationPath 'quickinstall.zip' -Force"

REM Rename to .blueprint (Blueprint expects .blueprint extension)
if exist quickinstall.zip (
    ren quickinstall.zip quickinstall.blueprint
    echo Created quickinstall.blueprint
) else (
    echo Failed to create zip
)
