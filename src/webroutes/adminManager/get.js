//Requires
const modulename = 'WebServer:AdminManagerGet';
const { dir, log, logOk, logWarn, logError } = require('../../extras/console')(modulename);


/**
 * Returns the output page containing the admins.
 * @param {object} ctx
 */
module.exports = async function AdminManagerGet(ctx) {
    //Prepare admin array
    let admins = globals.authenticator.getAdminsList().map((admin)=>{
        let perms;
        if(admin.master == true){
            perms = "master account";
        }else if(admin.permissions.includes('all_permissions')){
            perms = "all permissions";
        }else if(admin.permissions.length !== 1){
            perms = `${admin.permissions.length} permissions`;
        }else{
            perms = `1 permission`;
        }

        return {
            hasCitizenFX: (admin.providers.includes('citizenfx')),
            hasDiscord: (admin.providers.includes('discord')),
            name: admin.name,
            perms: perms,
            disableActions: (admin.master || ctx.session.auth.username.toLowerCase() === admin.name.toLowerCase())
        }
    });

    //Check permission
    if(!ctx.utils.checkPermission('manage.admins', modulename)){
        return ctx.utils.render('basic/generic', {message: `You don't have permission to view this page.`});
    }

    //Set render data
    let renderData = {
        headerTitle: 'Admin Manager',
        admins: admins,
        allPermissions: globals.authenticator.getPermissionsList()
    }

    //Give output
    return ctx.utils.render('adminManager', renderData);
};
