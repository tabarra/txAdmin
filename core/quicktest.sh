#!/bin/bash
GITHUB_REF="refs/tags/v7.7.7" npm run build

TARGET_PATH=/c/Users/tabarra/Desktop/PROGRAMMING/fxserver-container/server/alpine/opt/cfx-server/citizen/system_resources/monitor

echo "Copying build files to ${TARGET_PATH}..."

rm -rf "${TARGET_PATH}/core"
mkdir -p $TARGET_PATH
cp -r ../dist/core $TARGET_PATH
ls -la "${TARGET_PATH}/core"


echo "Done."
