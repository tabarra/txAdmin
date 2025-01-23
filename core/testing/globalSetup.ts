import type { GlobalSetupContext } from 'vitest/node'
import fs from "node:fs";
import path from "node:path";
import os from "node:os";


export default function setup({ config, provide }: GlobalSetupContext) {
    //Preparing fxspath
    const relativePath = os.platform() === 'win32'
        ? 'fxserver/'
        : 'alpine/opt/cfx-server/';
    const runId = Math.random().toString(36).substring(2, 15);
    const tempFolderPath = path.join(os.tmpdir(), `.txtest-${runId}`);
    // const tempFolderPath = path.join(os.tmpdir(), `.txtest-aaaaaaa`);
    const fxsPath = path.join(tempFolderPath, relativePath);
    const txDataPath = path.join(tempFolderPath, 'txData');
    provide('fxsPath', fxsPath);

    // Setup & Cleanup
    console.log('Setting temp folder:', tempFolderPath);
    fs.mkdirSync(fxsPath, { recursive: true });
    fs.mkdirSync(txDataPath, { recursive: true });

    return () => {
        console.log('Erasing temp folder:', tempFolderPath);
        fs.rmSync(tempFolderPath, { recursive: true });
    }
}

declare module 'vitest' {
    export interface ProvidedContext {
        fxsPath: string
    }
}
