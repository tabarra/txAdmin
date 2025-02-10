const modulename = 'WebServer:AdminManagerPage';
import { AuthedCtx } from '@modules/WebServer/ctxTypes';
import consoleFactory from '@lib/console';
const console = consoleFactory(modulename);


/**
 * Returns the output page containing the admins.
 */
export default async function AdminManagerPage(ctx: AuthedCtx) {
    //Check permission
    if (!ctx.admin.hasPermission('manage.admins')) {
        return ctx.utils.render('main/message', {message: 'You don\'t have permission to view this page.'});
    }

    //Prepare admin array
    const admins = txCore.adminStore.getAdminsList().map((admin) => {
        let perms;
        if (admin.master == true) {
            perms = 'master account';
        } else if (admin.permissions.includes('all_permissions')) {
            perms = 'all permissions';
        } else if (admin.permissions.length !== 1) {
            perms = `${admin.permissions.length} permissions`;
        } else {
            perms = '1 permission';
        }
        const isSelf = ctx.admin.name.toLowerCase() === admin.name.toLowerCase();

        return {
            hasCitizenFX: (admin.providers.includes('citizenfx')),
            hasDiscord: (admin.providers.includes('discord')),
            name: admin.name,
            perms: perms,
            isSelf,
            disableEdit: !ctx.admin.isMaster && admin.master,
            disableDelete: (admin.master || isSelf),
        };
    });

    //Set render data
    const renderData = {
        headerTitle: 'Admin Manager',
        admins,
    };

    //Give output
    return ctx.utils.render('main/adminManager', renderData);
};
