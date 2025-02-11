import path from "node:path";
import os from "node:os";

//FIXME: check the subpath/example.ts for how to find out the path without the env var
const fxServerPath = process.env.TXDEV_FXSERVER_PATH as string;

// Stubbing globals
globalThis.ExecuteCommand = (commandString: string) => {
    //noop
};
globalThis.GetConvar = (varName: string, defaultValue: string) => {
    if (varName === 'version') {
        if (os.platform() === 'win32') {
            return 'FXServer-test/txadmin SERVER v1.0.0.55555 win32';
        } else {
            return 'FXServer-test/txadmin v1.0.0.55555 linux';
        }
    } else if (varName === 'citizen_root') {
        return fxServerPath;
    } else if (varName === 'txAdminDevMode') {
        return 'false';
    } else if (varName === 'txAdminVerbose') {
        return 'false';
    } else {
        return defaultValue;
    }
};
globalThis.GetCurrentResourceName = () => {
    return 'monitor';
};
globalThis.GetPasswordHash = (password: string) => {
    //bcrypt hash for 'teste123'
    return '$2b$11$K3HwDzkoUfhU6.W.tScfhOLEtR5uNc9qpQ685emtERx3dZ7fmgXCy';

    // return Bun.password.hashSync(password, {
    //     algorithm: "bcrypt",
    //     cost: 11,
    // });
};
globalThis.GetResourceMetadata = (resourceName: string, metadataKey: string, index: number) => {
    if (resourceName === 'monitor' && metadataKey === 'version' && index === 0) {
        return '9.9.9';
    } else {
        throw new Error(`not implemented`);
    }
};
globalThis.GetResourcePath = (resourceName: string) => {
    if (resourceName === 'monitor') {
        return path.join(fxServerPath, 'citizen', 'system_resources', 'monitor');
    } else {
        throw new Error(`not implemented`);
    }
};
globalThis.IsDuplicityVersion = () => {
    return true;
};
globalThis.PrintStructuredTrace = (payload: string) => {
    //noop
};
globalThis.ScanResourceRoot = (rootPath: string, callback: (data: object) => void) => {
    throw new Error(`not implemented`);
};
globalThis.VerifyPasswordHash = (password: string, hash: string) => {
    return password === 'teste123';

    // if(typeof password !== 'string' || typeof hash !== 'string') return false;
    // //NOTE: need to replace the bcrypt version - https://github.com/oven-sh/bun/issues/9078
    // return Bun.password.verifySync(password, hash.replace(/^\$2a\$/, '$2b$'));
};
globalThis.Intl.getCanonicalLocales = (locales?: string | readonly string[] | undefined) => {
    return Array.isArray(locales) ? locales : [locales];
};
