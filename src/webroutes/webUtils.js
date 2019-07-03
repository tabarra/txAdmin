//Requires
const fs = require('fs');
const path = require('path');
const xss = require("xss");
const util = require('util');
const sqrl = require("squirrelly");
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../extras/console');
const readFileAsync = util.promisify(fs.readFile);
const context = 'WebUtils';


//================================================================
/**
 * Renders the master page including header and footer
 * @param {string} view 
 * @param {string} data 
 */
async function renderMasterView(view, data){
    if(typeof data === 'undefined') data = {};
    data.headerTitle = (typeof data.headerTitle !== 'undefined')? `${data.headerTitle} - txAdmin` : 'txAdmin';
    data.txAdminVersion = globals.version.current;

    let out;
    try {
        const [rawHeader, rawFooter, rawView] = await Promise.all([
            readFileAsync(getWebViewPath('header'), 'utf8'),
            readFileAsync(getWebViewPath('footer'), 'utf8'),
            readFileAsync(getWebViewPath(view), 'utf8')
        ]);
        sqrl.definePartial("header", rawHeader);
        sqrl.definePartial("footer", rawFooter);
        out = sqrl.Render(rawView, data);
    } catch (error) {
        if(globals.config.verbose) {
            logWarn(`Error rendering ${view}.`, context);
            dir(error)
        }
        out = `<pre>\n`;
        out += `Error rendering the requested page.\n`;
        out += `The data provided was:\n`;
        out += `================\n`;
        out += JSON.stringify(data, null, 2);
    }

    return out;
}


//================================================================
/**
 * Renders the login page.
 * @param {string} message 
 */
async function renderLoginView(message){
    let data;
    let out;
    try {
        data = {
            headerTitle: 'Login',
            message: (typeof message !== 'undefined')? message : '',
            config: globals.config.serverProfile,
            version: globals.version.current
        }

        let rawView = await readFileAsync(getWebViewPath('login'), 'utf8');
        out = sqrl.Render(rawView, data);
    } catch (error) {
        if(globals.config.verbose) {
            logWarn(`Error rendering the login page.`, context);
            dir(error)
        }
        out = `<pre>\n`;
        out += `Error rendering the requested page.\n`;
        out += `The data provided was:\n`;
        out += `================\n`;
        out += JSON.stringify(data, null, 2);
    }

    return out;
}


//================================================================
/**
 * Return the path of the provided view
 * @param {string} view 
 */
function getWebViewPath(view){
    return path.join(__dirname, '../../web/', view+'.html');
}


//================================================================
/**
 * Append data to the log file
 * @param {object} req 
 * @param {string} data 
 */
function appendLog(req, data, context){
    log(`Executing ${data}`, context);
    globals.logger.append(`[${req.connection.remoteAddress}][${req.session.auth.username}] ${data}`);
}



module.exports = {
    renderMasterView,
    renderLoginView,
    getWebViewPath,
    appendLog,
}
