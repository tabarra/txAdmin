const modulename = 'WebServer:DeployerActions';
import path from 'node:path';
import { cloneDeep } from 'lodash-es';
import slash from 'slash';
import mysql from 'mysql2/promise';
import consts from '@shared/consts';
import { txEnv, convars } from '@core/globalData';
import { validateModifyServerConfig } from '../../extras/fxsConfigHelper';
import consoleFactory from '@extras/console';
const console = consoleFactory(modulename);

//Helper functions
const isUndefined = (x) => (x === undefined);


/**
 * Handle all the server control actions
 * @param {object} ctx
 */
export default async function DeployerActions(ctx) {
    //Sanity check
    if (isUndefined(ctx.params.action)) {
        return ctx.utils.error(400, 'Invalid Request');
    }
    const action = ctx.params.action;

    //Check permissions
    if (!ctx.admin.testPermission('master', modulename)) {
        return ctx.send({ success: false, refresh: true });
    }

    //Check if this is the correct state for the deployer
    if (globals.deployer == null) {
        return ctx.send({ success: false, refresh: true });
    }

    //Delegate to the specific action functions
    if (action == 'confirmRecipe') {
        return await handleConfirmRecipe(ctx);
    } else if (action == 'setVariables') {
        return await handleSetVariables(ctx);
    } else if (action == 'commit') {
        return await handleSaveConfig(ctx);
    } else if (action == 'cancel') {
        return await handleCancel(ctx);
    } else {
        return ctx.send({
            type: 'danger',
            message: 'Unknown setup action.',
        });
    }
};


//================================================================
/**
 * Handle submition of user-edited recipe (record to deployer, starts the process)
 * @param {object} ctx
 */
async function handleConfirmRecipe(ctx) {
    //Sanity check
    if (isUndefined(ctx.request.body.recipe)) {
        return ctx.utils.error(400, 'Invalid Request - missing parameters');
    }
    const userEditedRecipe = ctx.request.body.recipe;

    try {
        ctx.admin.logAction('Setting recipe.');
        await globals.deployer.confirmRecipe(userEditedRecipe);
    } catch (error) {
        return ctx.send({ type: 'danger', message: error.message });
    }

    return ctx.send({ success: true });
}


//================================================================
/**
 * Handle submition of the input variables/parameters
 * @param {object} ctx
 */
async function handleSetVariables(ctx) {
    //Sanity check
    if (isUndefined(ctx.request.body.svLicense)) {
        return ctx.utils.error(400, 'Invalid Request - missing parameters');
    }
    const userVars = cloneDeep(ctx.request.body);

    //Validating sv_licenseKey
    if (
        !consts.regexSvLicenseNew.test(userVars.svLicense)
        && !consts.regexSvLicenseOld.test(userVars.svLicense)
    ) {
        return ctx.send({ type: 'danger', message: 'The Server License does not appear to be valid.' });
    }

    //DB Stuff
    if (typeof userVars.dbDelete !== 'undefined') {
        //Testing the db config
        try {
            userVars.dbPort = parseInt(userVars.dbPort);
            if (isNaN(userVars.dbPort)) {
                return ctx.send({ type: 'danger', message: 'The database port is invalid (non-integer). The default is 3306.' });
            }

            const mysqlOptions = {
                host: userVars.dbHost,
                port: userVars.dbPort,
                user: userVars.dbUsername,
                password: userVars.dbPassword,
                connectTimeout: 5000,
            };
            await mysql.createConnection(mysqlOptions);
        } catch (error) {
            let outMessage = error?.message ?? 'Unknown error occurred.';
            if (error?.code === 'ECONNREFUSED') {
                let specificError = (txEnv.isWindows)
                    ? 'If you do not have a database installed, you can download and run XAMPP.'
                    : 'If you do not have a database installed, you must download and run MySQL or MariaDB.';
                if (userVars.dbPort !== 3306) {
                    specificError += '<br>\n<b>You are not using the default DB port 3306, make sure it is correct!</b>';
                }
                outMessage = `${error?.message}<br>\n${specificError}`;
            } else if (error.message?.includes('auth_gssapi_client')) {
                outMessage = `Your database does not accept the required authentication method. Please update your MySQL/MariaDB server and try again.`;
            }

            return ctx.send({ type: 'danger', message: `<b>Database connection failed:</b> ${outMessage}` });
        }

        //Setting connection string
        userVars.dbDelete = (userVars.dbDelete === 'true');
        const dbFullHost = (userVars.dbPort === 3306)
            ? userVars.dbHost
            : `${userVars.dbHost}:${userVars.dbPort}`;
        userVars.dbConnectionString = (userVars.dbPassword.length)
            ? `mysql://${userVars.dbUsername}:${userVars.dbPassword}@${dbFullHost}/${userVars.dbName}?charset=utf8mb4`
            : `mysql://${userVars.dbUsername}@${dbFullHost}/${userVars.dbName}?charset=utf8mb4`;
    }

    //Max Clients & Server Endpoints
    userVars.maxClients = (convars.deployerDefaults && convars.deployerDefaults.maxClients) ? convars.deployerDefaults.maxClients : 48;
    if (convars.forceInterface) {
        const suffix = '# zap-hosting: do not modify!';
        userVars.serverEndpoints = [
            `endpoint_add_tcp "${convars.forceInterface}:${convars.forceFXServerPort}" ${suffix}`,
            `endpoint_add_udp "${convars.forceInterface}:${convars.forceFXServerPort}" ${suffix}`,
        ].join('\n');
    } else {
        userVars.serverEndpoints = [
            'endpoint_add_tcp "0.0.0.0:30120"',
            'endpoint_add_udp "0.0.0.0:30120"',
        ].join('\n');
    }

    //Setting identifiers array
    const admin = globals.adminVault.getAdminByName(ctx.admin.name);
    if (!admin) return ctx.send({ type: 'danger', message: 'Admin not found.' });
    const addPrincipalLines = [];
    Object.keys(admin.providers).forEach((providerName) => {
        if (admin.providers[providerName].identifier) {
            addPrincipalLines.push(`add_principal identifier.${admin.providers[providerName].identifier} group.admin #${ctx.admin.name}`);
        }
    });
    userVars.addPrincipalsMaster = (addPrincipalLines.length)
        ? addPrincipalLines.join('\n')
        : '# Deployer Note: this admin master has no identifiers to be automatically added.\n# add_principal identifier.discord:111111111111111111 group.admin #example';

    //Start deployer
    try {
        ctx.admin.logAction('Running recipe.');
        globals.deployer.start(userVars);
    } catch (error) {
        return ctx.send({ type: 'danger', message: error.message });
    }

    return ctx.send({ success: true });
}


//================================================================
/**
 * Handle the commit of a Recipe by receiving the user edited server.cfg
 * @param {object} ctx
 */
async function handleSaveConfig(ctx) {
    //Sanity check
    if (isUndefined(ctx.request.body.serverCFG)) {
        return ctx.utils.error(400, 'Invalid Request - missing parameters');
    }
    const serverCFG = ctx.request.body.serverCFG;
    const cfgFilePath = path.join(globals.deployer.deployPath, 'server.cfg');
    globals.persistentCache.set('deployer:recipe', globals.deployer?.recipe?.name ?? 'unknown');

    //Validating config contents + saving file and backup
    try {
        const result = await validateModifyServerConfig(serverCFG, cfgFilePath, globals.deployer.deployPath);
        if (result.errors) {
            return ctx.send({
                type: 'danger',
                success: false,
                markdown: true,
                message: `**Cannot save \`server.cfg\` due to error(s) in your config file(s):**\n${result.errors}`,
            });
        }
    } catch (error) {
        return ctx.send({
            type: 'danger',
            success: false,
            markdown: true,
            message: `**Failed to save \`server.cfg\` with error:**\n${error.message}`,
        });
    }

    //Preparing & saving config
    const newFXRunnerConfig = globals.configVault.getScopedStructure('fxRunner');
    newFXRunnerConfig.serverDataPath = slash(path.normalize(globals.deployer.deployPath));
    newFXRunnerConfig.cfgPath = slash(path.normalize(cfgFilePath));
    if (typeof globals.deployer.recipe.onesync !== 'undefined') {
        newFXRunnerConfig.onesync = globals.deployer.recipe.onesync;
    }
    try {
        globals.configVault.saveProfile('fxRunner', newFXRunnerConfig);
    } catch (error) {
        console.warn(`[${ctx.admin.name}] Error changing fxserver settings via deployer.`);
        console.verbose.dir(error);
        return ctx.send({
            type: 'danger',
            markdown: true,
            message: `**Error saving the configuration file:** ${error.message}`
        });
    }

    globals.fxRunner.refreshConfig();
    globals.statsManager.playerDrop.resetLog('Server Data Path or CFG Path changed.');
    ctx.admin.logAction('Completed and committed server deploy.');

    //Starting server
    const spawnError = await globals.fxRunner.spawnServer(false);
    if (spawnError !== null) {
        return ctx.send({
            type: 'danger',
            markdown: true,
            message: `Config file saved, but faied to start server with error:\n${spawnError}`,
        });
    } else {
        globals.deployer = null;
        globals.webServer?.webSocket.pushRefresh('status');
        return ctx.send({ success: true });
    }
}


//================================================================
/**
 * Handle the cancellation of the deployer proguess
 * @param {object} ctx
 */
async function handleCancel(ctx) {
    globals.deployer = null;
    globals.webServer?.webSocket.pushRefresh('status');
    return ctx.send({ success: true });
}
