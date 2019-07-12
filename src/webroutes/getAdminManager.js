//Requires
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../extras/console');
const webUtils = require('./webUtils.js');
const context = 'WebServer:getAdmins';


/**
 * Returns the output page containing the admins.
 * @param {object} res
 * @param {object} req
 */
module.exports = async function action(res, req) {

    let allPermissions = [
        "all",
        "manage.admins",
        "settings.view",
        "settings.write",
        "control.server",
        "control.scripts",
        "commands.scripts",
        "commands.kick",
        "commands.message",
        "console.view",
        "console.write",
    ];

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
            perms: perms
        }
    });

    let renderData = {
        headerTitle: 'Admin Manager',
        admins: admins,
        allPermissions: allPermissions
    }

    let out = await webUtils.renderMasterView('adminManager', renderData);
    return res.send(out);
};
