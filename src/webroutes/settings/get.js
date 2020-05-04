//Requires
const modulename = 'WebServer:SettingsGet';
const clone = require('clone');
const { dir, log, logOk, logWarn, logError } = require('../../extras/console')(modulename);


/**
 * Returns the output page containing the live console
 * @param {object} ctx
 */
module.exports = async function SettingsGet(ctx) {
    //Check permissions
    if(!ctx.utils.checkPermission('settings.view', modulename)){
        return ctx.utils.render('basic/generic', {message: `You don't have permission to view this page.`});
    }

    let renderData = {
        headerTitle: 'settings',
        global: cleanRenderData(globals.configVault.getScopedStructure('global')),
        fxserver: cleanRenderData(globals.configVault.getScopedStructure('fxRunner')),
        monitor: cleanRenderData(globals.configVault.getScopedStructure('monitor')),
        discord: cleanRenderData(globals.configVault.getScopedStructure('discordBot')),
        readOnly: !ctx.utils.checkPermission('settings.write', modulename, false),
        serverTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        activeTab: 'global'
    }

    return ctx.utils.render('settings', renderData);
};


//================================================================
function cleanRenderData(inputData){
    let input = clone(inputData);
    let out = {}
    Object.keys(input).forEach((prop) => {
        if(input[prop] == null || input[prop] === false || typeof input[prop] === 'undefined'){
            out[prop] = '';
        }else if(input[prop] === true){
            out[prop] = 'checked';
        }else if(input[prop].constructor === Array){
            out[prop] = input[prop].join(', ');
        }else if(input[prop].constructor === Object){
            out[prop] = cleanRenderData(input[prop]);
        }else{
            out[prop] = input[prop];
        }
    });
    return out;
}
