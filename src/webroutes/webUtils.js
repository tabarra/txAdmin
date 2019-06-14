//Requires
const fs = require('fs');
const path = require('path');
const xss = require("xss");
const sqrl = require("squirrelly");
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../extras/console');

/**
 * Render the output page and send result
 * FIXME: temporary FUNCTION
 * @param {object} res 
 * @param {string} msg 
 */
function sendOutput(res, msg, options){
    if(typeof options === 'undefined'){
        options = {
            escape: true,
            center: true
        }
    }
    if(typeof options.escape === 'undefined' || typeof options.escape !== 'boolean'){
        options.escape = true;
    }
    if(typeof options.center === 'undefined' || typeof options.center !== 'boolean'){
        options.center = true;
    }
    
    let toRender = {
        msg: (options.escape)? xss(msg) : msg,
        center: (options.center)? 'text-center' : ''
    }
    let html = renderTemplate('out', toRender);
    return res.send(html);
}

function getWebRootPath(file){
    return path.join(__dirname, '../../public/', file);
}

//FIXME: devia usar read fily async
function renderTemplate(view, data){
    if(typeof data === 'undefined') data = {};
    let rawTemplate = fs.readFileSync(getWebRootPath(view)+'.html', 'utf8');
    return sqrl.Render(rawTemplate, data); 
}


/**
 * Append data to the log file
 * @param {object} req 
 * @param {string} data 
 */
function appendLog(req, data, context){
    log(`Executing ${data}`, context);
    globals.logger.append(`[${req.connection.remoteAddress}][${req.session.admin}] ${data}`);
}

module.exports = {
    sendOutput,
    getWebRootPath,
    renderTemplate,
    appendLog,
}
