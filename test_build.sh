#!/bin/bash
cd "$(dirname "$0")"

# exit when any command fails
set -e

# testing target folder
TARGET_PATH=$1
if [ "$TARGET_PATH" == "" ]; then
    echo "Usage: $0 <target fxserver path>";
    echo "Example: $0 /e/FiveM/builds/5473";
    exit 1;
fi

if [ -d "$TARGET_PATH" ]; then
  echo "Copying build files to ${TARGET_PATH}..."
else
  echo "Error: ${TARGET_PATH} not found. Can not continue."
  exit 1
fi

# copying and running target fxserver
rm -rf "${TARGET_PATH}/citizen/system_resources/monitor/*"
cp -r dist/* "${TARGET_PATH}/citizen/system_resources/monitor"
cd $TARGET_PATH
./FXServer.exe
