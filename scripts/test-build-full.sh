#!/bin/bash
set -e

# Building
GITHUB_REF="refs/tags/v9.9.9-wip" npm run build

# Create zip file
powershell.exe -NoProfile -NonInteractive -Command \
    "Compress-Archive -LiteralPath (Get-ChildItem -LiteralPath 'dist' -Force).FullName -DestinationPath 'txadmin-tmp.zip' -Force"
mv -f "txadmin-tmp.zip" "txadmin.zip"

# Windows
TARGET_PATH_WIN=/e/FiveM/32561/citizen/system_resources/monitor
echo "Copying build files to ${TARGET_PATH_WIN}..."
rm -rf "${TARGET_PATH_WIN}"
mkdir -p "${TARGET_PATH_WIN}"
cp -r ./dist/. "${TARGET_PATH_WIN}"

# Container
TARGET_PATH_DOCKER=/c/Users/tabarra/Desktop/PROGRAMMING/fxserver-container/server/alpine/opt/cfx-server/citizen/system_resources/monitor
echo "Copying build files to ${TARGET_PATH_DOCKER}..."
rm -rf "${TARGET_PATH_DOCKER}"
mkdir -p "${TARGET_PATH_DOCKER}"
cp -r ./dist/. "${TARGET_PATH_DOCKER}"

echo "Done."
