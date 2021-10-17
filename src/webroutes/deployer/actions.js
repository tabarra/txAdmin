//Requires
const modulename = 'WebServer:DeployerActions';
const fs = require('fs-extra');
const path = require('path');
const cloneDeep = require('lodash/cloneDeep');
const mysql = require('mysql2/promise');
const slash = require('slash');
const { dir, log, logOk, logWarn, logError } = require('../../extras/console')(modulename);
const helpers = require('../../extras/helpers');

//Helper functions
const isUndefined = (x) => { return (typeof x === 'undefined'); };


/**
 * Handle all the server control actions
 * @param {object} ctx
 */
module.exports = async function DeployerActions(ctx) {
    //Sanity check
    if (isUndefined(ctx.params.action)) {
        return ctx.utils.error(400, 'Invalid Request');
    }
    const action = ctx.params.action;

    //Check permissions
    if (!ctx.utils.checkPermission('master', modulename)) {
        return ctx.send({success: false, refresh: true});
    }

    //Check if this is the correct state for the deployer
    if (globals.deployer == null) {
        return ctx.send({success: false, refresh: true});
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
        return ctx.send({type: 'danger', message: error.message});
    }

    return ctx.send({success: true});
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
        !GlobalData.regexSvLicenseNew.test(userVars.svLicense)
        && !GlobalData.regexSvLicenseOld.test(userVars.svLicense)
    ) {
        return ctx.send({type: 'danger', message: 'The Server License does not appear to be valid.'});
    }

    //DB Stuff
    if (typeof userVars.dbDelete !== 'undefined') {
        //Testing the db config
        try {
            const mysqlOptions = {
                host: userVars.dbHost,
                user: userVars.dbUsername,
                password: userVars.dbPassword,
            };
            await mysql.createConnection(mysqlOptions);
        } catch (error) {
            const msgHeader = `<b>Database connection failed:</b> ${error.message}`;
            if (error.code == 'ECONNREFUSED') {
                const osSpecific = (GlobalData.osType === 'windows')
                    ? 'If you do not have a database installed, you can download and run XAMPP.'
                    : 'If you do not have a database installed, you must download and run MySQL or MariaDB.';
                return ctx.send({type: 'danger', message: `${msgHeader}<br>\n${osSpecific}`});
            } else {
                return ctx.send({type: 'danger', message: msgHeader});
            }
        }

        //Setting connection string
        userVars.dbDelete = (userVars.dbDelete === 'true');
        userVars.dbConnectionString = (userVars.dbPassword.length)
            ? `mysql://${userVars.dbUsername}:${userVars.dbPassword}@${userVars.dbHost}/${userVars.dbName}?charset=utf8mb4`
            : `mysql://${userVars.dbUsername}@${userVars.dbHost}/${userVars.dbName}?charset=utf8mb4`;
    }

    //Max Clients & Server Endpoints
    userVars.maxClients = (GlobalData.deployerDefaults && GlobalData.deployerDefaults.maxClients) ? GlobalData.deployerDefaults.maxClients : 48;
    if (GlobalData.forceInterface) {
        const suffix = '# zap-hosting: do not modify!';
        userVars.serverEndpoints = [
            `endpoint_add_tcp "${GlobalData.forceInterface}:${GlobalData.forceFXServerPort}" ${suffix}`,
            `endpoint_add_udp "${GlobalData.forceInterface}:${GlobalData.forceFXServerPort}" ${suffix}`,
        ].join('\n');
    } else {
        userVars.serverEndpoints = [
            'endpoint_add_tcp "0.0.0.0:30120"',
            'endpoint_add_udp "0.0.0.0:30120"',
        ].join('\n');
    }

    //Setting identifiers array
    const admin = globals.adminVault.getAdminByName(ctx.session.auth.username);
    if (!admin) return ctx.send({type: 'danger', message: 'Admin not found.'});
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
        return ctx.send({type: 'danger', message: error.message});
    }

    return ctx.send({success: true});
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

    //Saving backup file
    try {
        await fs.copy(cfgFilePath, `${cfgFilePath}.bkp`);
    } catch (error) {
        const message = `Failed to backup 'server.cfg' file with error: ${error.message}`;
        if (GlobalData.verbose) logWarn(message);
        return ctx.send({type: 'danger', message});
    }

    //Validating config contents
    try {
        const _port = helpers.getFXServerPort(serverCFG);
    } catch (error) {
        return ctx.send({type: 'danger', message: `<strong>server.cfg error:</strong> <br>${error.message}`});
    }

    //Saving CFG file
    try {
        await fs.writeFile(cfgFilePath, serverCFG, 'utf8');
        ctx.utils.logAction('Configured server.cfg from deployer.');
    } catch (error) {
        const message = `Failed to edit 'server.cfg' with error: ${error.message}`;
        if (GlobalData.verbose) logWarn(message);
        return ctx.send({type: 'danger', message});
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
            return ctx.send({type: 'danger', message: `Faied to start server with error: <br>\n${spawnMsg}`});
        } else {
            globals.deployer = null;
            return ctx.send({success: true});
        }
    } else {
        logWarn(`[${ctx.session.auth.username}] Error changing fxserver settings via deployer.`);
        return ctx.send({type: 'danger', message: '<strong>Error saving the configuration file.</strong>'});
    }
}


//================================================================
/**
 * Handle the cancellation of the deployer proguess
 * @param {object} ctx
 */
async function handleCancel(ctx) {
    globals.deployer = null;
    return ctx.send({success: true});
}
