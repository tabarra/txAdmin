import fs from 'node:fs';


//Keeping the typo mostly so I can remember the old usage types
type ZapConfigVars = {
    providerName: string;
    forceInterface: string | undefined;
    forceFXServerPort: number | undefined;
    txAdminPort: number | undefined;
    loginPageLogo: string | undefined;
    defaultMasterAccount?: {
        name: string,
        password_hash: string
    };
    deployerDefaults: {
        license?: string,
        maxClients?: number,
        mysqlHost?: string,
        mysqlPort?: string,
        mysqlUser?: string,
        mysqlPassword?: string,
        mysqlDatabase?: string,
    };
}

const allowType = (type: 'string' | 'number', value: any) => typeof value === type ? value : undefined;


/**
 * Gets & parses the txAdminZapConfig.json variables
 */
export const getZapVars = (zapCfgFilePath: string): ZapConfigVars | undefined => {
    if (!fs.existsSync(zapCfgFilePath)) return;
    console.warn(`WARNING: The 'txAdminZapConfig.json' file has been deprecated and this feature will be removed in the next update.`);
    console.warn(`         Please use the 'TXHOST_' environment variables instead.`);
    console.warn(`         For more information: https://aka.cfx.re/txadmin-env-config.`);
    const cfgFileData = JSON.parse(fs.readFileSync(zapCfgFilePath, 'utf8'));

    const zapVars: ZapConfigVars = {
        providerName: 'ZAP-Hosting',

        forceInterface: allowType('string', cfgFileData.interface),
        forceFXServerPort: allowType('number', cfgFileData.fxServerPort),
        txAdminPort: allowType('number', cfgFileData.txAdminPort),
        loginPageLogo: allowType('string', cfgFileData.loginPageLogo),

        deployerDefaults: {
            license: allowType('string', cfgFileData.defaults.license),
            maxClients: allowType('number', cfgFileData.defaults.maxClients),
            mysqlHost: allowType('string', cfgFileData.defaults.mysqlHost),
            mysqlUser: allowType('string', cfgFileData.defaults.mysqlUser),
            mysqlPassword: allowType('string', cfgFileData.defaults.mysqlPassword),
            mysqlDatabase: allowType('string', cfgFileData.defaults.mysqlDatabase),
        },
    }

    //Port is a special case because the cfg is likely int, but we want string
    if(typeof cfgFileData.defaults.mysqlPort === 'string') {
        zapVars.deployerDefaults.mysqlPort = cfgFileData.defaults.mysqlPort;
    } else if (typeof cfgFileData.defaults.mysqlPort === 'number') {
        zapVars.deployerDefaults.mysqlPort = String(cfgFileData.defaults.mysqlPort);
    }

    //Validation is done in the globalData file
    if (cfgFileData.customer) {
        zapVars.defaultMasterAccount = {
            name: allowType('string', cfgFileData.customer.name),
            password_hash: allowType('string', cfgFileData.customer.password_hash),
        };
    }

    return zapVars;
}
