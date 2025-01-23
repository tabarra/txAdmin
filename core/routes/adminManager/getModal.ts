const modulename = 'WebServer:AdminManagerGetModal';
import { AuthedCtx } from '@modules/WebServer/ctxTypes';
import consoleFactory from '@lib/console';
const console = consoleFactory(modulename);

//Separate permissions in general perms and menu perms, and mark the dangerous ones
const dangerousPerms = ['all_permissions', 'manage.admins', 'console.write', 'settings.write'];
const getPerms = (checkPerms: string[], allPermissions: [string, string][]) => {
    type PermType = {
        id: string;
        desc: string;
        checked: string;
        dangerous: boolean;
    };
    const permsGeneral: PermType[] = [];
    const permsMenu: PermType[] = [];
    for (const [id, desc] of allPermissions) {
        const bucket = (id.startsWith('players.') || id.startsWith('menu.')) ? permsGeneral : permsMenu;
        bucket.push({
            id,
            desc,
            checked: (checkPerms.includes(id)) ? 'checked' : '',
            dangerous: dangerousPerms.includes(id),
        });
    }
    return [permsGeneral, permsMenu];
};


/**
 * Returns the output page containing the admins.
 */
export default async function AdminManagerGetModal(ctx: AuthedCtx) {
    //Sanity check
    if (typeof ctx.params.modalType !== 'string') {
        return ctx.utils.error(400, 'Invalid Request');
    }
    const modalType = ctx.params.modalType;

    //Check permissions
    if (!ctx.admin.testPermission('manage.admins', modulename)) {
        return ctx.send({
            type: 'danger',
            message: 'You don\'t have permission to execute this action.',
        });
    }

    //Check which modal type to show
    let isNewAdmin;
    if (modalType == 'add') {
        isNewAdmin = true;
    } else if (modalType == 'edit') {
        isNewAdmin = false;
    } else {
        return ctx.send({
            type: 'danger',
            message: 'Unknown modalType.',
        });
    }

    //If it's a modal for new admin, all fields will be empty
    const allPermissions = Object.entries(txCore.adminStore.getPermissionsList());
    if (isNewAdmin) {
        const [permsGeneral, permsMenu] = getPerms([], allPermissions);
        const renderData = {
            isNewAdmin: true,
            username: '',
            citizenfx_id: '',
            discord_id: '',
            permsGeneral,
            permsMenu,
        };
        return ctx.utils.render('parts/adminModal', renderData);
    }

    //Sanity check
    if (typeof ctx.request.body.name !== 'string') {
        return ctx.utils.error(400, 'Invalid Request - missing parameters');
    }
    const name = ctx.request.body.name.trim();

    //Get admin data
    const admin = txCore.adminStore.getAdminByName(name);
    if (!admin) return ctx.send('Admin not found');

    //Check if editing an master admin
    if (!ctx.admin.isMaster && admin.master) {
        return ctx.send('You cannot edit an admin master.');
    }

    //Prepare permissions
    const [permsGeneral, permsMenu] = getPerms(admin.permissions, allPermissions);

    //Set render data
    const renderData = {
        isNewAdmin: false,
        username: admin.name,
        citizenfx_id: (admin.providers.citizenfx) ? admin.providers.citizenfx.id : '',
        discord_id: (admin.providers.discord) ? admin.providers.discord.id : '',
        permsGeneral,
        permsMenu,
    };

    //Give output
    return ctx.utils.render('parts/adminModal', renderData);
};
