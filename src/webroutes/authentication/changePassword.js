//Requires
const modulename = 'WebServer:AuthChangePassword';
const { dir, log, logOk, logWarn, logError } = require('../../extras/console')(modulename);

//Helper functions
const isUndefined = (x) => { return (typeof x === 'undefined'); };

/**
 * Returns the output page containing the admins.
 * @param {object} ctx
 */
module.exports = async function AuthChangePassword(ctx) {
    //Sanity check
    if (isUndefined(ctx.request.body.newPassword)) {
        return ctx.utils.error(400, 'Invalid Request');
    }

    //Check if temp password
    if (!ctx.session.auth.isTempPassword && isUndefined(ctx.request.body.oldPassword)) {
        return ctx.send({type: 'danger', message: 'The permanent password was already set.'});
    }

    //Validate fields
    let newPassword = ctx.request.body.newPassword.trim();
    if (!ctx.session.auth.isTempPassword && !isUndefined(ctx.request.body.oldPassword)) {
        let admin = globals.adminVault.getAdminByName(ctx.session.auth.username);
        if (!admin) throw new Error('Wait, what? Where is that admin?');
        let oldPassword = ctx.request.body.oldPassword.trim();
        if (!VerifyPasswordHash(oldPassword, admin.password_hash)) {
            return ctx.send({type: 'danger', message: 'Wrong current password'});
        }
    }
    if (newPassword.length < 8 || newPassword.length > 24) {
        return ctx.send({type: 'danger', message: 'The new password has to be between 8 and 24 characters.'});
    }
    if (!newPassword.match(/(?=.*[a-z])/)) {
        return ctx.send({type: 'danger', message: 'The new password must contain at least one lowercase letter'});
    }
    if (!newPassword.match(/(?=.*[A-Z])/)) {
        return ctx.send({type: 'danger', message: 'The new password must contain at least one uppercase letter'});
    }
    if (!newPassword.match(/(?=.*\d)/)) {
        return ctx.send({type: 'danger', message: 'The new password must contain at least one number'});
    }
    if (!newPassword.match(/(?=.*[#$@!%&*?])/)) {
        return ctx.send({type: 'danger', message: 'The new password must contain at least one special character'});
    }

    //Add admin and give output
    try {
        let newHash = await globals.adminVault.editAdmin(ctx.session.auth.username, newPassword);
        if (typeof ctx.session.auth.password_hash == 'string') ctx.session.auth.password_hash = newHash;
        ctx.utils.logAction('Changing own password.');
        ctx.session.auth.password = newPassword;
        return ctx.send({type: 'success', message: 'Password changed successfully'});
    } catch (error) {
        return ctx.send({type: 'danger', message: error.message});
    }
};
