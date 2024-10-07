import path from "path";
import { vi } from "vitest";

// Stubbing env vars
vi.stubEnv('TERM', 'xterm-256color');
vi.stubEnv('FORCE_COLOR', '3');
vi.stubEnv('TXADMIN_DEV_SRC_PATH', path.join(process.cwd(), '..'));
vi.stubEnv('TXADMIN_DEV_VITE_URL', 'http://localhost:40122');
if (process.env.CI) {
    const citizenRoot = path.join(process.cwd(), 'alpine/opt/cfx-server/');
    vi.stubEnv('TXADMIN_DEV_FXSERVER_PATH', citizenRoot);
}


// Stubbing globals
vi.stubGlobal('ExecuteCommand', (commandString: string) => {
    //noop
});
vi.stubGlobal('GetConvar', (varName: string, defaultValue: string) => {
    if (varName === 'version') {
        return 'v1.0.0.9998';
    } else if (varName === 'citizen_root') {
        return path.join(process.env.TXADMIN_DEV_FXSERVER_PATH!,);
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
    return 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
});
vi.stubGlobal('GetResourceMetadata', (resourceName: string, metadataKey: string, index: number) => {
    if (resourceName === 'monitor' && metadataKey === 'version' && index === 0) {
        return 'v9.9.9';
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
