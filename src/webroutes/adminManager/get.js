//Requires
const modulename = 'WebServer:AdminManager-Get';
const { dir, log, logOk, logWarn, logError} = require('../../extras/console')(modulename);


/**
 * Returns the output page containing the admins.
 * @param {object} res
 * @param {object} req
 */
module.exports = async function action(res, req) {
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
            disableActions: (req.session.auth.username.toLowerCase() === admin.name.toLowerCase())
        }
    });

    //Check permission
    if(!webUtils.checkPermission(req, 'manage.admins', modulename)){
        let out = await webUtils.renderMasterView('basic/generic', req.session, {message: `You don't have permission to view this page.`});
        return res.send(out);
    }

    //Set render data
    let renderData = {
        headerTitle: 'Admin Manager',
        admins: admins,
        allPermissions: globals.authenticator.getPermissionsList()
    }

    //Give output
    let out = await webUtils.renderMasterView('adminManager', req.session, renderData);
    return res.send(out);
};
