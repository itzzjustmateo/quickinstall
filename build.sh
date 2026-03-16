#!/bin/bash

# Create a blueprint zip for Pterodactyl QuickInstall extension

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Files and directories to exclude from the zip
EXCLUDE=(
    "--exclude=.git"
    "--exclude=.gitignore"
    "--exclude=*.sh"
    "--exclude=*.bat"
    "--exclude=*.ps1"
    "--exclude=README.md"
    "--exclude=LICENSE"
    "--exclude=.blueprint"
    "--exclude=node_modules"
)

# Create the zip
zip -r quickinstall.zip \
    "${EXCLUDE[@]}" \
    app/ \
    conf.yml \
    routes/ \
    resources/

echo "Created quickinstall.blueprint"
echo User action required to make it .blueprint format
