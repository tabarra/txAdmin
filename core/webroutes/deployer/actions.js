const modulename = 'WebServer:DeployerActions';
import path from 'path';
import { cloneDeep }  from 'lodash-es';
import slash from 'slash';
import mysql from 'mysql2/promise'
import consts from '@core/extras/consts.js';
import logger from '@core/extras/console.js';
import { txEnv, convars } from '@core/globalData.js';
import { validateModifyServerConfig } from '../../extras/fxsConfigHelper';
const { dir, log, logOk, logWarn, logError } = logger(modulename);

//Helper functions
const isUndefined = (x) => { return (typeof x === 'undefined'); };


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
    if (!ctx.utils.checkPermission('master', modulename)) {
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
        ctx.utils.logAction('Setting recipe.');
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
            const msgHeader = `<b>Database connection failed:</b> ${error.message}`;
            if (error.code == 'ECONNREFUSED') {
                let specificError = (txEnv.isWindows)
                    ? 'If you do not have a database installed, you can download and run XAMPP.'
                    : 'If you do not have a database installed, you must download and run MySQL or MariaDB.';
                if (userVars.dbPort !== 3306) {
                    specificError += '<br>\n<b>You are not using the default DB port 3306, make sure it is correct!</b>';
                }
                return ctx.send({ type: 'danger', message: `${msgHeader}<br>\n${specificError}` });
            } else {
                return ctx.send({ type: 'danger', message: msgHeader });
            }
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
    const admin = globals.adminVault.getAdminByName(ctx.session.auth.username);
    if (!admin) return ctx.send({ type: 'danger', message: 'Admin not found.' });
    const addPrincipalLines = [];
    Object.keys(admin.providers).forEach((providerName) => {
        if (admin.providers[providerName].identifier) {
            addPrincipalLines.push(`add_principal identifier.${admin.providers[providerName].identifier} group.admin #${ctx.session.auth.username}`);
        }
    });
    userVars.addPrincipalsMaster = (addPrincipalLines.length)
        ? addPrincipalLines.join('\n')
        : '# Deployer Note: this admin master has no identifiers to be automatically added.\n# add_principal identifier.discord.111111111111111111 group.admin #example';

    //Start deployer
    try {
        ctx.utils.logAction('Running recipe.');
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
    const saveFXRunnerStatus = globals.configVault.saveProfile('fxRunner', newFXRunnerConfig);

    if (saveFXRunnerStatus) {
        globals.fxRunner.refreshConfig();
        ctx.utils.logAction('Completed and committed server deploy.');

        //Starting server
        const spawnMsg = await globals.fxRunner.spawnServer(false);
        if (spawnMsg !== null) {
            return ctx.send({
                type: 'danger',
                markdown: true,
                message: `Config file saved, but faied to start server with error:\n${spawnMsg}`,
            });
        } else {
            globals.deployer = null;
            return ctx.send({ success: true });
        }
    } else {
        logWarn(`[${ctx.session.auth.username}] Error changing fxserver settings via deployer.`);
        return ctx.send({
            type: 'danger',
            markdown: true,
            message: '**Error saving the configuration file.**',
        });
    }
}


//================================================================
/**
 * Handle the cancellation of the deployer proguess
 * @param {object} ctx
 */
async function handleCancel(ctx) {
    globals.deployer = null;
    return ctx.send({ success: true });
}
