import path from "node:path";
import { vi, inject } from "vitest";
import os from "node:os";

// Stubbing globals
vi.stubGlobal('ExecuteCommand', (commandString: string) => {
    //noop
});
vi.stubGlobal('GetConvar', (varName: string, defaultValue: string) => {
    if (varName === 'version') {
        if (os.platform() === 'win32') {
            return 'FXServer-test/txadmin SERVER v1.0.0.55555 win32';
        } else {
            return 'FXServer-test/txadmin v1.0.0.55555 linux';
        }
    } else if (varName === 'citizen_root') {
        return inject('fxsPath');
    } else if (varName === 'txAdminDevMode') {
        return 'false';
    } else if (varName === 'txAdminVerbose') {
        return 'false';
    } else {
        return defaultValue;
    }
});
vi.stubGlobal('GetCurrentResourceName', () => {
    return 'monitor';
});
vi.stubGlobal('GetPasswordHash', (password: string) => {
    //bcrypt hash for 'teste123'
    return '$2b$11$K3HwDzkoUfhU6.W.tScfhOLEtR5uNc9qpQ685emtERx3dZ7fmgXCy';
});
vi.stubGlobal('GetResourceMetadata', (resourceName: string, metadataKey: string, index: number) => {
    if (resourceName === 'monitor' && metadataKey === 'version' && index === 0) {
        return '9.9.9';
    } else {
        throw new Error(`not implemented`);
    }
});
vi.stubGlobal('GetResourcePath', (resourceName: string) => {
    if (resourceName === 'monitor') {
        return path.join(__dirname, '..', '..');
    } else {
        throw new Error(`not implemented`);
    }
});
vi.stubGlobal('IsDuplicityVersion', () => {
    return true;
});
vi.stubGlobal('PrintStructuredTrace', (payload: string) => {
    //noop
});
vi.stubGlobal('ScanResourceRoot', (rootPath: string, callback: (data: object) => void) => {
    throw new Error(`not implemented`);
});
vi.stubGlobal('VerifyPasswordHash', (password: string, hash: string) => {
    return true;
});
vi.stubGlobal('Intl.getCanonicalLocales', (locales?: string | readonly string[] | undefined) => {
    return Array.isArray(locales) ? locales : [locales];
});
