//Requires
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../extras/console');
const webUtils = require('./webUtils.js');
const context = 'WebServer:getAdminManager';


/**
 * Returns the output page containing the admins.
 * @param {object} res
 * @param {object} req
 */
module.exports = async function action(res, req) {
    //Prepare admin array
    let admins = globals.authenticator.getAdmins().map((admin)=>{
        let perms;
        if(admin.permissions.includes('all')){
            perms = "all permissions";
        }else if(admin.permissions.length !== 1){
            perms = `${admin.permissions.length} permissions`;
        }else{
            perms = `1 permission`;
        }

        return {
            name: admin.name,
            perms: perms,
            disableActions: (req.session.auth.username.toLowerCase() === admin.name.toLowerCase())? 'disabled': ''
        }
    });

    //Check permission
    if(!webUtils.checkPermission(req, 'manage.admins', context)){
        let out = await webUtils.renderMasterView('generic', {message: `You don't have permission to view this page.`});
        return res.send(out);
    }

    //Set render data
    let renderData = {
        headerTitle: 'Admin Manager',
        admins: admins,
        allPermissions: globals.authenticator.getPermissionsList()
    }

    //Give output
    let out = await webUtils.renderMasterView('adminManager', renderData);
    return res.send(out);
};
