//Requires
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
        global: cleanRenderData({
            serverName: globals.config.serverName,
            publicIP: globals.config.publicIP,
            forceFxPort: globals.config.fxServerPort,
            verbose: globals.config.verbose
        }),
        fxserver: cleanRenderData({
            buildPath: globals.fxRunner.config.buildPath,
            basePath: globals.fxRunner.config.basePath,
            cfgPath: globals.fxRunner.config.cfgPath,
            onesync: globals.fxRunner.config.onesync,
            autostart: globals.fxRunner.config.autostart,
            quiet: globals.fxRunner.config.quiet
        }),
        monitor: cleanRenderData({
            timeout: globals.monitor.config.timeout,
            failures: globals.monitor.config.restarter.failures,
            schedule: globals.monitor.config.restarter.schedule.join(', '),
        }),
        discord: cleanRenderData({
            enabled: globals.discordBot.config.enabled,
            token: globals.discordBot.config.token,
            statusCommand: globals.discordBot.config.statusCommand,
        }),
    }
    dir(renderData)

    let out = await webUtils.renderMasterView('settings', renderData);
    return res.send(out);
};


//================================================================
function cleanRenderData(input){
    input = {...input};
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
