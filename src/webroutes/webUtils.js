//Requires
const fs = require('fs');
const path = require('path');
const xss = require("xss");
const util = require('util');
const sqrl = require("squirrelly");
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../extras/console');
const readFileAsync = util.promisify(fs.readFile);


//TODO: Error handling
async function renderMasterView(view, data){
    if(typeof data === 'undefined') data = {};
    data.headerTitle = (typeof data.headerTitle !== 'undefined')? `${data.headerTitle} - txAdmin` : 'txAdmin';

    const [rawHeader, rawFooter, rawView] = await Promise.all([
        readFileAsync(getWebViewPath('header'), 'utf8'),
        readFileAsync(getWebViewPath('footer'), 'utf8'),
        readFileAsync(getWebViewPath(view), 'utf8')
    ]);
    sqrl.definePartial("header", rawHeader);
    sqrl.definePartial("footer", rawFooter);

    return sqrl.Render(rawView, data);
}

//TODO: Error handling
async function renderLoginView(message){
    let data = {
        headerTitle: 'Login',
        message: (typeof message !== 'undefined')? message : '',
        config: globals.config.configName,
        port: globals.config.fxServerPort,
        version: globals.version.current
    }

    let rawView = await readFileAsync(getWebViewPath('login'), 'utf8');
    return sqrl.Render(rawView, data);
}

function getWebViewPath(file){
    return path.join(__dirname, '../../web/', file+'.html');
}


/**
 * Append data to the log file
 * @param {object} req 
 * @param {string} data 
 */
function appendLog(req, data, context){
    log(`Executing ${data}`, context);
    globals.logger.append(`[${req.connection.remoteAddress}][${req.session.auth.username}] ${data}`);
}







//HACK deprecar daqui pra baixo
function getWebRootPath(file){
    return path.join(__dirname, '../../public/', file);
}


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



//FIXME: devia usar read fily async
function renderTemplate(view, data){
    if(typeof data === 'undefined') data = {};
    let rawTemplate = fs.readFileSync(getWebRootPath(view)+'.html', 'utf8');
    return sqrl.Render(rawTemplate, data); 
}




module.exports = {
    renderMasterView,
    renderLoginView,
    getWebViewPath,
    getWebRootPath,
    appendLog,
    sendOutput,
    renderTemplate,
}
