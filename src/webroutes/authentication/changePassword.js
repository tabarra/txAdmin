//Requires
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../../extras/console');
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
    if(isUndefined(req.body.newPassword)){
        res.status(400).send({status: 'error', error: "Invalid Request"});
        return;
    }

    //Check if temp password
    if(!req.session.auth.isTempPassword && isUndefined(req.body.oldPassword)){
        res.send({type: 'danger', message: "The permanent password was already set."});
        return;
    }

    //Validate fields
    let newPassword = req.body.newPassword.trim();
    if(!req.session.auth.isTempPassword && !isUndefined(req.body.oldPassword)){
        let admin = globals.authenticator.getAdminByName(req.session.auth.username);
        if(!admin) throw new Error("Wait, what? Where is that admin?");
        let oldPassword = req.body.oldPassword.trim();
        if(!VerifyPasswordHash(oldPassword, admin.password_hash)){
            return res.send({type: 'danger', message: "Wrong current password"});
        }
    }
    if(newPassword.length < 6 || newPassword.length > 32){
        return res.send({type: 'danger', message: "Invalid new password"});
    }

    //Add admin and give output
    try {
        let newHash = await globals.authenticator.editAdmin(req.session.auth.username, newPassword);
        if(typeof req.session.auth.password_hash == 'string') req.session.auth.password_hash = newHash;
        let logMessage = `[${req.connection.remoteAddress}][${req.session.auth.username}] Changing own password.`;
        logOk(logMessage, context);
        globals.logger.append(logMessage);
        req.session.auth.password = newPassword;
        return res.send({type: 'success', message: `Password changed successfully`});
    } catch (error) {
        return res.send({type: 'danger', message: error.message});
    }
};
