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
const convarWarning = (convarName: string, newName: string) => {
    console.warn(`WARNING: The ConVar '${convarName}' is deprecated and will be removed in the next update.`);
    console.warn(`WARNING: Please use the '${newName}' environment variable instead.`);
    console.warn(`WARNING: For more information: https://aka.cfx.re/txadmin-env-config`);
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

    //Convars
    const txAdminProfile = getConvarString('serverProfile');

    //Deprecated convars
    let txDataPath, txAdminPort, txAdminInterface;
    if(!ignoreDeprecatedConfigs) {
        txDataPath = getConvarString('txDataPath');
        if (txDataPath) convarWarning('txDataPath', 'TXHOST_DATA_PATH');
        txAdminPort = getConvarString('txAdminPort');
        if (txAdminPort) convarWarning('txAdminPort', 'TXHOST_TXA_PORT');
        txAdminInterface = getConvarString('txAdminInterface');
        if (txAdminInterface) convarWarning('txAdminInterface', 'TXHOST_INTERFACE');
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
