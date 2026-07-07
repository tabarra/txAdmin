import fatalError from '@lib/fatalError';

const deprecatedConvarNames = [
    'serverProfile',
    'txDataPath',
    'txAdminPort',
    'txAdminInterface',
] as const;

const fatalConvarError = (convarName: string): never => {
    fatalError.GlobalData(27, [
        `The \`${convarName}\` ConVar is deprecated and no longer supported.`,
        'Please migrate to the new environment variable configuration.',
        'For more information: https://aka.cfx.re/txadmin-env-config',
        '', //dash divider
        'If you are using the `start_<version>_<profile>.bat` script,',
        'either edit it or double click the FXServer.exe file directly.',
    ]);
}


/**
 * Checks if the user is trying to run txAdmin using deprecated convars.
 * If detected, throws a fatal error pointing them to the documentation.
 */
export const checkDeprecatedConvars = () => {
    const GetConvar = (globalThis as any).GetConvar as
        | ((varName: string, default_: string) => string)
        | undefined;

    //Check using GetConvar if available
    if (typeof GetConvar === 'function') {
        for (const name of deprecatedConvarNames) {
            const value = GetConvar(name, 'undefined');
            if (value !== 'undefined') {
                fatalConvarError(name);
            }
        }
        return;
    }

    //Fallback: check process.argv for +set {name}
    const args = process.argv;
    for (let i = 0; i < args.length - 1; i++) {
        if (!/^\+set(s|r)?$/.test(args[i])) continue;
        const convarName = args[i + 1];
        if (deprecatedConvarNames.includes(convarName as any)) {
            fatalConvarError(convarName);
        }
    }
};
