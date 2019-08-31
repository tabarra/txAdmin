//Requires
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../../extras/console');
const webUtils = require('./../webUtils.js');
const context = 'WebServer:Auth-ChangePassword';

//Helper functions
const isUndefined = (x) => { return (typeof x === 'undefined') };

/**
 * Returns the output page containing the admins.
 * @param {object} res
 * @param {object} req
 */
module.exports = async function action(res, req) {
    //Sanity check
    if(isUndefined(req.body.oldPassword) || isUndefined(req.body.newPassword)){
        res.status(400).send({status: 'error', error: "Invalid Request"});
        return;
    }


    //Validate fields
    let oldPassword = req.body.oldPassword.trim();
    let newPassword = req.body.newPassword.trim();
    if(oldPassword !== req.session.auth.password){
        return res.send({type: 'danger', message: "Wrong current password"});
    }
    if(oldPassword.length < 6 || oldPassword.length > 32){
        return res.send({type: 'danger', message: "Invalid new password"});
    }

    //Add admin and give output
    try {
        await globals.authenticator.editAdmin(req.session.auth.username, newPassword);
        let logMessage = `[${req.connection.remoteAddress}][${req.session.auth.username}] Changing own password.`;
        logOk(logMessage, context);
        globals.logger.append(logMessage);
        req.session.auth.password = newPassword;
        return res.send({type: 'success', message: `Password changed successfully`});
    } catch (error) {
        return res.send({type: 'danger', message: error.message});
    }
};
