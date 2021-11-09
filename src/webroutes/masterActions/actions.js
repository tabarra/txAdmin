/* eslint-disable no-unused-vars */
//Requires
const modulename = 'WebServer:MasterActions:Action';
const fs = require('fs-extra');
const mysql = require('mysql2/promise');
const { dir, log, logOk, logWarn, logError } = require('../../extras/console')(modulename);

//Helper functions
const now = () => { return Math.round(Date.now() / 1000); };
const isUndefined = (x) => { return (typeof x === 'undefined'); };
const anyUndefined = (...args) => { return [...args].some((x) => (typeof x === 'undefined')); };
const filterIdentifiers = (idArr) => idArr.filter((id) => {
    return (typeof id == 'string') && Object.values(GlobalData.validIdentifiers).some((vf) => vf.test(id));
});


/**
 * Handle all the master actions... actions
 * @param {object} ctx
 */
module.exports = async function MasterActionsAction(ctx) {
    //Sanity check
    if (isUndefined(ctx.params.action)) {
        return ctx.utils.error(400, 'Invalid Request');
    }
    const action = ctx.params.action;

    //Check permissions
    if (!ctx.utils.checkPermission('master', modulename)) {
        return ctx.utils.render('basic/generic', {message: 'Only the master account has permission to view/use this page.' });
    }
    if (!ctx.txVars.isWebInterface) {
        return ctx.utils.render('basic/generic', {message: 'This functionality cannot be used by the in-game menu, please use the web version of txAdmin.'});
    }

    //Delegate to the specific action functions
    if (action == 'reset_fxserver') {
        return handleResetFXServer(ctx);
    } else if (action == 'importBans') {
        const fileDbTypes = ['easyadmin', 'vmenu'];
        const dbmsDbTypes = ['bansql', 'vrp', 'el_bwh'];
        if (fileDbTypes.includes(ctx.request.body.dbType)) {
            return await handleImportBansFile(ctx, ctx.request.body.dbType);
        } else if (dbmsDbTypes.includes(ctx.request.body.dbType)) {
            return await handleImportBansDBMS(ctx, ctx.request.body.dbType);
        } else {
            return ctx.send({type: 'danger', message: 'Invalid database type.'});
        }
    } else if (action == 'cleanDatabase') {
        return handleCleanDatabase(ctx);
    } else {
        return ctx.send({
            type: 'danger',
            message: 'Unknown settings action.',
        });
    }
};


//================================================================
/**
 * Handle FXServer settings reset nad resurn to setup
 * @param {object} ctx
 */
function handleResetFXServer(ctx) {
    if (globals.fxRunner.fxChild !== null) {
        ctx.utils.logCommand('STOP SERVER');
        globals.fxRunner.killServer(ctx.session.auth.username);
    }

    //Making sure the deployer is not running
    globals.deployer = null;

    //Preparing & saving config
    const newConfig = globals.configVault.getScopedStructure('fxRunner');
    newConfig.serverDataPath = false;
    newConfig.cfgPath = false;
    const saveStatus = globals.configVault.saveProfile('fxRunner', newConfig);

    //Sending output
    if (saveStatus) {
        globals.fxRunner.refreshConfig();
        ctx.utils.logAction('Resetting fxRunner settings.');
        return ctx.send({success: true});
    } else {
        logWarn(`[${ctx.session.auth.username}] Error resetting fxRunner settings.`);
        return ctx.send({type: 'danger', message: '<strong>Error saving the configuration file.</strong>'});
    }
}


//================================================================
/**
 * Handle the ban import via file
 * @param {object} ctx
 * @param {string} dbType
 */
async function handleImportBansFile(ctx, dbType) {
    //Sanity check
    if (isUndefined(ctx.request.body.banFile)) {
        return ctx.utils.error(400, 'Invalid Request');
    }
    const banFilePath = ctx.request.body.banFile;

    //Read bans database file
    let inBans;
    try {
        const rawFile = await fs.readFile(banFilePath);
        inBans = JSON.parse(rawFile);
    } catch (error) {
        return ctx.utils.render('basic/generic', {message: `<b>Failed to import bans with error:</b><br> ${error.message}`});
    }

    let invalid = 0;
    let imported = 0;
    try {
        for (let index = 0; index < inBans.length; index++) {
            const ban = inBans[index];
            const identifiers = filterIdentifiers(ban.identifiers);
            if (!identifiers.length) {
                invalid++;
                continue;
            }

            let author, reason, expiration;
            if (dbType == 'easyadmin') {
                author = (typeof ban.banner == 'string' && ban.banner.length) ? ban.banner.trim() : 'unknown';
                reason = (typeof ban.reason == 'string' && ban.reason.length) ? `[IMPORTED] ${ban.reason.trim()}` : '[IMPORTED] unknown';
                if (ban.expire == 10444633200) {
                    expiration = false;
                } else if (Number.isInteger(ban.expire)) {
                    expiration = ban.expire;
                } else {
                    invalid++;
                    continue;
                }
            } else if (dbType == 'vmenu') {
                author = (typeof ban.bannedBy == 'string' && ban.bannedBy.length) ? ban.bannedBy.trim() : 'unknown';
                reason = (typeof ban.banReason == 'string' && ban.banReason.length) ? `[IMPORTED] ${ban.banReason.trim()}` : '[IMPORTED] unknown';
                if (ban.bannedUntil == '3000-01-01T00:00:00') {
                    expiration = false;
                } else {
                    const expirationDate = new Date(ban.bannedUntil);
                    if (expirationDate.toString() == 'Invalid Date') {
                        invalid++;
                        continue;
                    } else {
                        expiration = Math.round(expirationDate.getTime() / 1000);
                    }
                }
            }

            await globals.playerController.registerAction(identifiers, 'ban', author, reason, expiration);
            imported++;
        }// end for()
    } catch (error) {
        if (GlobalData.verbose) dir(error);
        return ctx.utils.render('basic/generic', {message: `<b>Failed to import bans with error:</b><br> ${error.message}`});
    }

    const outMessage = `<b>Process finished!</b> <br>
        Imported bans: ${imported} <br>
        Invalid bans: ${invalid}  <br>`;
    return ctx.utils.render('basic/generic', {message: outMessage});
}


//================================================================
/**
 * Handle the ban import via DBMS
 * @param {object} ctx
 * @param {string} dbType
 */
async function handleImportBansDBMS(ctx, dbType) {
    //Sanity check
    if (anyUndefined(
        ctx.request.body.dbHost,
        ctx.request.body.dbUsername,
        ctx.request.body.dbPassword,
        ctx.request.body.dbName,
    )) {
        return ctx.utils.error(400, 'Invalid Request');
    }

    // Connect to the database
    let dbConnection;
    try {
        const mysqlOptions = {
            host: ctx.request.body.dbHost.trim(),
            user: ctx.request.body.dbUsername.trim(),
            password: ctx.request.body.dbPassword.trim(),
            database: ctx.request.body.dbName.trim(),
        };
        dbConnection = await mysql.createConnection(mysqlOptions);
    } catch (error) {
        return ctx.utils.render('basic/generic', {message: `<b>Database connection failed:</b><br> ${error.message}`});
    }

    let imported = 0;
    let invalid = 0;
    try {
        if (dbType == 'bansql') {
            const [rows, _fields] = await dbConnection.execute('SELECT * FROM banlist');
            for (let index = 1; index < rows.length; index++) {
                const ban = rows[index];
                const tmpIdentifiers = [ban.identifier, ban.license, ban.liveid, ban.xblid, ban.discord];
                const identifiers = filterIdentifiers(tmpIdentifiers);
                if (!identifiers.length) {
                    invalid++;
                    continue;
                }

                const author = (typeof ban.sourceplayername == 'string' && ban.sourceplayername.length) ? ban.sourceplayername.trim() : 'unknown';
                const reason = (typeof ban.reason == 'string' && ban.reason.length) ? `[IMPORTED] ${ban.reason.trim()}` : '[IMPORTED] unknown';
                let expiration;
                if ((typeof ban.permanent && ban.permanent) || !ban.expiration) {
                    expiration = false;
                } else {
                    const expirationInt = parseInt(ban.expiration);
                    expiration = (Number.isNaN(expirationInt)) ? false : expirationInt;
                }
                await globals.playerController.registerAction(identifiers, 'ban', author, reason, expiration);
                imported++;
            }
        } else if (dbType == 'vrp') {
            const [rows, _fields] = await dbConnection.execute(`SELECT 
                    GROUP_CONCAT(vrp_user_ids.identifier SEPARATOR ', ') AS identifiers
                FROM vrp_users 
                JOIN vrp_user_ids ON vrp_user_ids.user_id=vrp_users.id
                WHERE vrp_users.banned = 1
                GROUP BY vrp_users.id`);
            for (let index = 0; index < rows.length; index++) {
                const ban = rows[index];
                const identifiers = filterIdentifiers(ban.identifiers.split(', '));
                if (!identifiers.length) {
                    invalid++;
                    continue;
                }
                await globals.playerController.registerAction(identifiers, 'ban', 'unknown', 'imported from vRP', false);
                imported++;
            }
        } else if (dbType == 'el_bwh') {
            const [rows, _fields] = await dbConnection.execute('SELECT * FROM bwh_bans');

            for (let index = 0; index < rows.length; index++) {
                const ban = rows[index];
                if (typeof ban.unbanned !== 'undefined' && ban.unbanned !== 0) {
                    //Just ignoring it
                    continue;
                }
                let dbIdentifiers;
                try {
                    dbIdentifiers = JSON.parse(ban.receiver);
                    if (!Array.isArray(dbIdentifiers)) throw new Error('not an array');
                } catch (error) {
                    invalid++;
                    continue;
                }
                const identifiers = filterIdentifiers(dbIdentifiers);
                if (!identifiers.length) {
                    invalid++;
                    continue;
                }

                const reason = (typeof ban.reason == 'string' && ban.reason.length) ? `[IMPORTED] ${ban.reason.trim()}` : '[IMPORTED] unknown';
                let expiration;
                if (ban.length == null) {
                    expiration = false;
                } else {
                    const expirationDate = new Date(ban.length);
                    if (expirationDate.toString() == 'Invalid Date') {
                        invalid++;
                        continue;
                    } else {
                        expiration = Math.round(expirationDate.getTime() / 1000);
                    }
                }
                await globals.playerController.registerAction(identifiers, 'ban', 'unknown', reason, expiration);
                imported++;
            }
        }
    } catch (error) {
        if (GlobalData.verbose) dir(error);
        return ctx.utils.render('basic/generic', {message: `<b>Failed to import bans with error:</b><br> ${error.message}`});
    }

    const outMessage = `<b>Process finished!</b> <br>
        Imported bans: ${imported} <br>
        Invalid bans: ${invalid}  <br>`;
    return ctx.utils.render('basic/generic', {message: outMessage});
}


//================================================================
/**
 * Handle clean database request
 * @param {object} ctx
 */
async function handleCleanDatabase(ctx) {
    //Sanity check
    if (
        typeof ctx.request.body.players !== 'string'
        || typeof ctx.request.body.bans !== 'string'
        || typeof ctx.request.body.warns !== 'string'
        || typeof ctx.request.body.whitelists !== 'string'
    ) {
        return ctx.utils.error(400, 'Invalid Request');
    }
    const players = ctx.request.body.players;
    const bans = ctx.request.body.bans;
    const warns = ctx.request.body.warns;
    const whitelists = ctx.request.body.whitelists;
    const daySecs = 86400;
    const currTs = now();

    let playersFilter;
    if (players === 'none') {
        playersFilter = (x) => false;
    } else if (players === '60d') {
        playersFilter = (x) => x.tsLastConnection < (currTs - 60 * daySecs) && !x.notes.text.length;
    } else if (players === '30d') {
        playersFilter = (x) => x.tsLastConnection < (currTs - 30 * daySecs) && !x.notes.text.length;
    } else if (players === '15d') {
        playersFilter = (x) => x.tsLastConnection < (currTs - 15 * daySecs) && !x.notes.text.length;
    } else {
        return ctx.utils.error(400, 'Invalid players filter type.');
    }

    let bansFilter;
    if (bans === 'none') {
        bansFilter = (x) => false;
    } else if (bans === 'revoked') {
        bansFilter = (x) => x.type === 'ban' && x.revocation.timestamp;
    } else if (bans === 'revokedExpired') {
        bansFilter = (x) => x.type === 'ban' && (x.revocation.timestamp || (x.expiration && x.expiration < currTs));
    } else if (bans === 'all') {
        bansFilter = (x) => x.type === 'ban';
    } else {
        return ctx.utils.error(400, 'Invalid bans filter type.');
    }

    let warnsFilter;
    if (warns === 'none') {
        warnsFilter = (x) => false;
    } else if (warns === 'revoked') {
        warnsFilter = (x) => x.type === 'warn' && x.revocation.timestamp;
    } else if (warns === '30d') {
        warnsFilter = (x) => x.type === 'warn' && x.timestamp < (currTs - 30 * daySecs);
    } else if (warns === '15d') {
        warnsFilter = (x) => x.type === 'warn' && x.timestamp < (currTs - 15 * daySecs);
    } else if (warns === '7d') {
        warnsFilter = (x) => x.type === 'warn' && x.timestamp < (currTs - 7 * daySecs);
    } else if (warns === 'all') {
        warnsFilter = (x) => x.type === 'warn';
    } else {
        return ctx.utils.error(400, 'Invalid warns filter type.');
    }

    let whitelistsFilter;
    if (whitelists === 'none') {
        whitelistsFilter = (x) => false;
    } else if (whitelists === '30d') {
        whitelistsFilter = (x) => x.type === 'whitelist' && x.timestamp < (currTs - 30 * daySecs);
    } else if (whitelists === '15d') {
        whitelistsFilter = (x) => x.type === 'whitelist' && x.timestamp < (currTs - 15 * daySecs);
    } else if (whitelists === 'all') {
        whitelistsFilter = (x) => x.type == 'whitelist';
    } else {
        return ctx.utils.error(400, 'Invalid whitelists filter type.');
    }
    const actionsFilter = (x) => {
        return bansFilter(x) || warnsFilter(x) || whitelistsFilter(x);
    };


    const tsStart = new Date();
    let playersRemoved = 0;
    try {
        playersRemoved = await globals.playerController.cleanDatabase('players', playersFilter);
    } catch (error) {
        return ctx.utils.render('basic/generic', {message: `<b>Failed to clean players with error:</b><br>${error.message}`});
    }

    let actionsRemoved = 0;
    try {
        actionsRemoved = await globals.playerController.cleanDatabase('actions', actionsFilter);
    } catch (error) {
        return ctx.utils.render('basic/generic', {message: `<b>Failed to clean actions with error:</b><br>${error.message}`});
    }

    const tsElapsed = new Date() - tsStart;
    const outMessage = `<b>Process finished in ${tsElapsed}ms.</b> <br>
        Players deleted: ${playersRemoved} <br>
        Actions deleted: ${actionsRemoved}  <br>`;
    return ctx.utils.render('basic/generic', {message: outMessage});
}
