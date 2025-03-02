import path from 'node:path';


//Helper function to get convars WITHOUT a fallback value
const undefinedKey = 'UNDEFINED:CONVAR:' + Math.random().toString(36).substring(2, 15);
const getConvarString = (convarName: string) => {
    const cvar = GetConvar(convarName, undefinedKey);
    return (cvar !== undefinedKey) ? cvar.trim() : undefined;
};

//Helper to clean up the resource native responses which apparently might be 'null'
const cleanNativeResp = (resp: any) => {
    return (typeof resp === 'string' && resp !== 'null' && resp.length) ? resp : undefined;
};

//Warning for convar usage
let anyWarnSent = false;
const replacedConvarWarning = (convarName: string, newName: string) => {
    console.warn(`WARNING: The '${convarName}' ConVar is deprecated and will be removed in the next update.`);
    console.warn(`         Please use the '${newName}' environment variable instead.`);
    anyWarnSent = true;
}


/**
 * Native variables that are required for the boot process.  
 * This file is not supposed to validate or default any of the values.
 */
export const getNativeVars = (ignoreDeprecatedConfigs: boolean) => {
    //FXServer
    const fxsVersion = getConvarString('version');
    const fxsCitizenRoot = getConvarString('citizen_root');

    //Resource
    const resourceName = cleanNativeResp(GetCurrentResourceName());
    if (!resourceName) throw new Error('GetCurrentResourceName() failed');
    const txaResourceVersion = cleanNativeResp(GetResourceMetadata(resourceName, 'version', 0));
    const txaResourcePath = cleanNativeResp(GetResourcePath(resourceName));

    //Profile Convar - with warning
    const txAdminProfile = getConvarString('serverProfile');
    if (txAdminProfile) {
        console.warn(`WARNING: The 'serverProfile' ConVar is deprecated and will be removed in a future update.`);
        console.warn(`         To create multiple servers, set up a different TXHOST_DATA_PATH instead.`);
        anyWarnSent = true;
    }

    //Convars replaced by TXHOST_* env vars
    let txDataPath, txAdminPort, txAdminInterface;
    if (!ignoreDeprecatedConfigs) {
        txDataPath = getConvarString('txDataPath');
        if (txDataPath) {
            replacedConvarWarning('txDataPath', 'TXHOST_DATA_PATH');
            //As it used to support relative paths, we need to resolve it
            if (!path.isAbsolute(txDataPath)) {
                txDataPath = path.resolve(txDataPath);
                console.error(`WARNING: The 'txDataPath' ConVar is not an absolute path, please update it to:`);
                console.error(`         TXHOST_DATA_PATH=${txDataPath}`);
            }
        }
        txAdminPort = getConvarString('txAdminPort');
        if (txAdminPort) replacedConvarWarning('txAdminPort', 'TXHOST_TXA_PORT');
        txAdminInterface = getConvarString('txAdminInterface');
        if (txAdminInterface) replacedConvarWarning('txAdminInterface', 'TXHOST_INTERFACE');
    }

    if (anyWarnSent) {
        console.warn(`WARNING: For more information: https://aka.cfx.re/txadmin-env-config`);
    }

    //Final object
    return {
        fxsVersion,
        fxsCitizenRoot,
        resourceName,
        txaResourceVersion,
        txaResourcePath,

        //custom vars
        txAdminProfile,
        txDataPath,
        txAdminPort,
        txAdminInterface,
    };
}
