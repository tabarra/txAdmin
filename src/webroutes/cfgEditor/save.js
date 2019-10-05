//Requires
const fs = require('fs');
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../../extras/console');
const webUtils = require('./../webUtils.js');
const context = 'WebServer:CFGEditor-Save';

//Helper functions
const isUndefined = (x) => { return (typeof x === 'undefined') };

/**
 * Saves the server.cfg
 * @param {object} res
 * @param {object} req
 */
module.exports = async function action(res, req) {
    //Sanity check
    if(isUndefined(req.body.cfgData)){
        res.status(400).send({status: 'error', error: "Invalid Request"});
        return;
    }

    //TODO:
    res.status(400).send({status: 'error', error: "not implemented"});
    return;
};
