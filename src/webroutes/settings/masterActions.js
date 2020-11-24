//Requires
const modulename = 'WebServer:SettingsSave';
const { dir, log, logOk, logWarn, logError } = require('../../extras/console')(modulename);
const helpers = require('../../extras/helpers');

//Helper functions
const isUndefined = (x) => { return (typeof x === 'undefined') };
const anyUndefined = (...args) => { return [...args].some(x => (typeof x === 'undefined')) };

/**
 * Handle all the server control actions
 * @param {object} ctx
 */
module.exports = async function SettingsSave(ctx) {
    //Sanity check
    if(isUndefined(ctx.params.action)){
        return ctx.utils.error(400, 'Invalid Request');
    }
    let action = ctx.params.action;

    //Check permissions
    if(!ctx.utils.checkPermission('master', modulename)){
        return ctx.send({
            type: 'danger',
            message: `You don't have permission to execute this action.`
        });
    }

    //Delegate to the specific action functions
    if(action == 'reset'){
        return handleReset(ctx);
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
