//Requires
const fs = require('fs-extra');
const path = require('path');
const sqrl = require("squirrelly");
const helpers = require('../extras/helpers');
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../extras/console');
const context = 'WebUtils';

//Helper functions
const isUndefined = (x) => { return (typeof x === 'undefined') };


//================================================================
/**
 * Renders the master page including header and footer
 * @param {string} view
 * @param {string} data
 */
async function renderMasterView(view, reqSess, data){
    if(isUndefined(data)) data = {};
    data.headerTitle = (!isUndefined(data.headerTitle))? `${data.headerTitle} - txAdmin` : 'txAdmin';
    data.txAdminVersion = globals.version.current;
    data.adminUsername = (reqSess && reqSess.auth && reqSess.auth.username)? reqSess.auth.username : 'unknown user';

    let out;
    try {
        const [rawHeader, rawFooter, rawView] = await Promise.all([
            fs.readFile(getWebViewPath('basic/header'), 'utf8'),
            fs.readFile(getWebViewPath('basic/footer'), 'utf8'),
            fs.readFile(getWebViewPath(view), 'utf8')
        ]);
        sqrl.definePartial("header", rawHeader);
        sqrl.definePartial("footer", rawFooter);
        sqrl.defineFilter("isSelected", (x)=>{
            return (x==='true')? 'selected' : ''
        });
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
    let viewName = (Math.random() > 0.1)? 'login' : 'login-matrix';
    let data;
    let out;
    try {
        data = {
            headerTitle: 'Login',
            ascii: helpers.txAdminASCII(),
            message: (!isUndefined('message'))? message : '',
            config: globals.config.serverProfile,
            version: globals.version.current
        }

        let rawView = await fs.readFile(getWebViewPath(`basic/${viewName}`), 'utf8');
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
 * Renders a solo view.
 * NOTE: not used
 * @param {string} view
 * @param {string} data
 */
async function renderSoloView(view, data){
    if(isUndefined(data)) data = {};
    let out;
    try {
        let rawView = await fs.readFile(getWebViewPath(view), 'utf8');
        out = sqrl.Render(rawView, data);
    } catch (error) {
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
 * FIXME: edit consistency of this function and apply to all endpoints
 * @param {object} req
 * @param {string} data
 */
function appendLog(req, data, context){
    log(`Executing "${data}"`, context);
    globals.logger.append(`[${req.connection.remoteAddress}][${req.session.auth.username}] ${data}`);
}


//================================================================
/**
 * Check for a permission
 * @param {object} req
 * @param {string} perm
 * @param {string} fromCtx
 */
function checkPermission(req, perm, fromCtx){
    try {
        if(req.session.auth.permissions.includes('all') || req.session.auth.permissions.includes(perm)){
            return true;
        }else{
            if(globals.config.verbose) logWarn(`[${req.connection.remoteAddress}][${req.session.auth.username}] Permission '${perm}' denied.`, fromCtx);
            return false;
        }
    } catch (error) {
        if(globals.config.verbose && typeof fromCtx === 'string') logWarn(`Error validating permission '${perm}' denied.`, fromCtx);
    }
}


module.exports = {
    renderMasterView,
    renderLoginView,
    renderSoloView,
    getWebViewPath,
    appendLog,
    checkPermission,
}
