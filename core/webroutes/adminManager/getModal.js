const modulename = 'WebServer:AdminManagerGetModal';
import logger from '@core/extras/console.js';
const { dir, log, logOk, logWarn, logError } = logger(modulename);

//Helper functions
const isUndefined = (x) => { return (typeof x === 'undefined'); };
const dangerousPerms = ['all_permissions', 'manage.admins', 'console.write', 'settings.write'];


/**
 * Returns the output page containing the admins.
 * @param {object} ctx
 */
export default async function AdminManagerGetModal(ctx) {
    //Sanity check
    if (isUndefined(ctx.params.modalType)) {
        return ctx.utils.error(400, 'Invalid Request');
    }
    let modalType = ctx.params.modalType;

    //Check permissions
    if (!ctx.utils.testPermission('manage.admins', modulename)) {
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


    const allPermissions = Object.entries(globals.adminVault.getPermissionsList());

    //Helper function
    const getPerms = (checkPerms) => {
        let permsGeneral = [];
        let permsMenu = [];
        allPermissions.forEach(([id, desc]) => {
            const bucket = (id.startsWith('players.') || id.startsWith('menu.')) ? permsGeneral : permsMenu;
            bucket.push({
                id,
                desc,
                checked: (checkPerms.includes(id)) ? 'checked' : '',
                dangerous: dangerousPerms.includes(id),
            });
        });
        return [permsGeneral, permsMenu];
    };

    //If it's a modal for new admin, all fields will be empty
    if (isNewAdmin) {
        const [permsGeneral, permsMenu] = getPerms([]);
        const renderData = {
            isNewAdmin: true,
            editingSelf: false,
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
    const admin = globals.adminVault.getAdminByName(name);
    if (!admin) return ctx.send('Admin not found');

    //Check if editing an master admin
    if (!ctx.session.auth.master && admin.master) {
        return ctx.send('You cannot edit an admin master.');
    }

    //Prepare permissions
    const [permsGeneral, permsMenu] = getPerms(admin.permissions);

    //Set render data
    const renderData = {
        isNewAdmin: false,
        username: admin.name,
        citizenfx_id: (admin.providers.citizenfx) ? admin.providers.citizenfx.id : '',
        discord_id: (admin.providers.discord) ? admin.providers.discord.id : '',
        editingSelf: (ctx.session.auth.username.toLowerCase() === name.toLowerCase()),
        permsGeneral,
        permsMenu,
    };

    //Give output
    return ctx.utils.render('parts/adminModal', renderData);
};
