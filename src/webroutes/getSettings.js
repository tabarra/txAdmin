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
    let renderData = {
        headerTitle: 'settings',
        global: cleanRenderData(globals.configVault.getScopedStructure('global')),
        fxserver: cleanRenderData(globals.configVault.getScopedStructure('fxRunner')),
        monitor: cleanRenderData(globals.configVault.getScopedStructure('monitor')),
        discord: cleanRenderData(globals.configVault.getScopedStructure('discordBot')),
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
        }else{
            out[prop] = input[prop];
        }
    });
    return out;
}
