//Requires
const modulename = 'WebServer:DangerZone:Action';
const fs = require('fs-extra');
const { dir, log, logOk, logWarn, logError } = require('../../extras/console')(modulename);
const helpers = require('../../extras/helpers');

//Helper functions
const isUndefined = (x) => { return (typeof x === 'undefined') };
const anyUndefined = (...args) => { return [...args].some(x => (typeof x === 'undefined')) };


/**
 * Handle all the danger zone actions
 * @param {object} ctx
 */
module.exports = async function DangerZoneAction(ctx) {
    //Sanity check
    if(isUndefined(ctx.params.action)){
        return ctx.utils.error(400, 'Invalid Request');
    }
    const action = ctx.params.action;

    //Check permissions
    if(!ctx.utils.checkPermission('master', modulename)){
        return ctx.send({
            type: 'danger',
            message: `Only the master account has permission to view/use this page.`
        });
    }

    //Delegate to the specific action functions
    if(action == 'reset'){
        return handleReset(ctx);
    }else if(action == 'importBans'){
        if(ctx.request.body.dbType == 'easyadmin' || ctx.request.body.dbType == 'vmenu'){
            return await handleImportBansFile(ctx, ctx.request.body.dbType);
        }else if(ctx.request.body.dbType == 'bansql' || ctx.request.body.dbType == 'vrp'){
            return await handleImportBansDBMS(ctx, ctx.request.body.dbType);
        }else{
            return ctx.send({type: 'danger', message: `Invalid database type.`});
        }
        
    }else{
        return ctx.send({
            type: 'danger',
            message: 'Unknown settings action.'
        });
    }
};


//================================================================
/**
 * Handle FXServer settinga reset nad resurn to setup
 * @param {object} ctx
 */
function handleReset(ctx) {
    if(globals.fxRunner.fxChild !== null){
        ctx.utils.logCommand(`STOP SERVER`);
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
    if(saveStatus){
        globals.fxRunner.refreshConfig();
        ctx.utils.logAction(`Resetting fxRunner settings.`);
        return ctx.send({success: true});
    }else{
        logWarn(`[${ctx.ip}][${ctx.session.auth.username}] Error resetting fxRunner settings.`);
        return ctx.send({type: 'danger', message: `<strong>Error saving the configuration file.</strong>`});
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
    if(isUndefined(ctx.request.body.banfile)){
        return ctx.utils.error(400, 'Invalid Request');
    }
    const banfilePath = ctx.request.body.banfile;
    dir(ctx.request.files)

    let rawFile;
    try {
        rawFile = await fs.readFile(banfilePath)
    } catch (error) {
        return ctx.utils.render('basic/generic', {message: `Failed to import bans with error: ${error.message}`});
    }
    
    if(dbType == 'easyadmin'){
        try {
            const eaBans = JSON.parse(rawFile);
            let invalid = 0;
            let imported = 0;

            for (let index = 0; index < eaBans.length; index++) {
                const ban = eaBans[index];
                const identifiers = ban.identifiers.filter((id)=>{
                    return (typeof id == 'string') && Object.values(GlobalData.validIdentifiers).some(vf => vf.test(id));
                });
                if(!identifiers.length){
                    invalid++;
                    continue;
                }
                const author = (typeof ban.banner == 'string' && ban.banner.length)? ban.banner.trim() : 'unknown';
                const reason = (typeof ban.reason == 'string' && ban.reason.length)? `[IMPORTED] ${ban.reason.trim()}` : '[IMPORTED] unknown';
                let expiration;
                if(ban.expire == 10444633200){
                    expiration = false;
                }else if(Number.isInteger(ban.expire)){
                    expiration = ban.expire;
                }else{
                    invalid++;
                    continue;
                }

                let actionID = await globals.playerController.registerAction(identifiers, 'ban', author, reason, expiration);
                imported++;
            }

            let outMessage = `Process finished! <br>
                Imported bans: ${imported} <br>
                Invalid bans: ${invalid}  <br>`;
            return ctx.utils.render('basic/generic', {message: outMessage});

        } catch (error) {
            dir(error)
            return ctx.utils.render('basic/generic', {message: `Failed to import bans with error: ${error.message}`});
        }


        

    }else if(dbType == 'vmenu'){
        return ctx.send({type: 'danger', message: `fileeee`});

    } 
}

//================================================================
/**
 * Handle the ban import via dbms
 * @param {object} ctx
 * @param {string} dbType
 */
async function handleImportBansDBMS(ctx, dbType) {
    //Sanity check
    if(anyUndefined(ctx.params.action)){
        return ctx.utils.error(400, 'Invalid Request');
    }
    const action = ctx.params.action;
    dir(ctx.request.body)

    return ctx.send({type: 'danger', message: `dbmssss`});
}
