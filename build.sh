#!/bin/bash

# Create a blueprint zip for Pterodactyl QuickInstall extension

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Remove old build if exists
rm -f quickinstall.blueprint

# Create the zip (Blueprint expects a zip file)
zip -r quickinstall.zip \
    --exclude=".git/*" \
    --exclude=".gitignore" \
    --exclude="*.sh" \
    --exclude="*.bat" \
    --exclude="*.ps1" \
    --exclude="README.md" \
    --exclude="LICENSE" \
    --exclude=".blueprint/*" \
    --exclude="node_modules/*" \
    app/ \
    conf.yml \
    routes/ \
    resources/

# Rename to .blueprint (Blueprint expects .blueprint extension)
mv quickinstall.zip quickinstall.blueprint

echo "Created quickinstall.blueprint"
