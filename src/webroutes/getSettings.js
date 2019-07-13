//Requires
const clone = require('clone');
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../extras/console');
const webUtils = require('./webUtils.js');
const context = 'WebServer:getSettings';


/**
 * Returns the output page containing the live console
 * @param {object} res
 * @param {object} req
 */
module.exports = async function action(res, req) {
    //Check permissions
    if(!webUtils.checkPermission(req, 'settings.view', context)){
        let out = await webUtils.renderMasterView('generic', {message: `You don't have permission to view this page.`});
        return res.send(out);
    }

    let renderData = {
        headerTitle: 'settings',
        global: cleanRenderData(globals.configVault.getScopedStructure('global')),
        fxserver: cleanRenderData(globals.configVault.getScopedStructure('fxRunner')),
        monitor: cleanRenderData(globals.configVault.getScopedStructure('monitor')),
        discord: cleanRenderData(globals.configVault.getScopedStructure('discordBot')),
        disableWrite: (webUtils.checkPermission(req, 'settings.write'))? '' : 'disabled'
    }

    let out = await webUtils.renderMasterView('settings', renderData);
    return res.send(out);
};


//================================================================
function cleanRenderData(inputData){
    let input = clone(inputData);
    let out = {}
    Object.keys(input).forEach((prop) => {
        if(input[prop] === null || input[prop] === false){
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
