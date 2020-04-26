//Requires
const modulename = 'WebServer:AuthChangePassword';
const { dir, log, logOk, logWarn, logError } = require('../../extras/console')(modulename);

//Helper functions
const isUndefined = (x) => { return (typeof x === 'undefined') };

/**
 * Returns the output page containing the admins.
 * @param {object} ctx
 */
module.exports = async function AuthChangePassword(ctx) {
    //Sanity check
    if(isUndefined(ctx.request.body.newPassword)){
        return ctx.utils.error(400, 'Invalid Request');
    }

    //Check if temp password
    if(!ctx.session.auth.isTempPassword && isUndefined(ctx.request.body.oldPassword)){
        return ctx.send({type: 'danger', message: "The permanent password was already set."});
    }

    //Validate fields
    let newPassword = ctx.request.body.newPassword.trim();
    if(!ctx.session.auth.isTempPassword && !isUndefined(ctx.request.body.oldPassword)){
        let admin = globals.authenticator.getAdminByName(ctx.session.auth.username);
        if(!admin) throw new Error("Wait, what? Where is that admin?");
        let oldPassword = ctx.request.body.oldPassword.trim();
        if(!VerifyPasswordHash(oldPassword, admin.password_hash)){
            return ctx.send({type: 'danger', message: "Wrong current password"});
        }
    }
    if(newPassword.length < 6 || newPassword.length > 32){
        return ctx.send({type: 'danger', message: "Invalid new password"});
    }

    //Add admin and give output
    try {
        let newHash = await globals.authenticator.editAdmin(ctx.session.auth.username, newPassword);
        if(typeof ctx.session.auth.password_hash == 'string') ctx.session.auth.password_hash = newHash;
        let logMessage = `[${ctx.ip}][${ctx.session.auth.username}] Changing own password.`;
        logOk(logMessage);
        globals.logger.append(logMessage);
        ctx.session.auth.password = newPassword;
        return ctx.send({type: 'success', message: `Password changed successfully`});
    } catch (error) {
        return ctx.send({type: 'danger', message: error.message});
    }
};
