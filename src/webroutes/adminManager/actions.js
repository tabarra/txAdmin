//Requires
const modulename = 'WebServer:AdminManagerActions';
const { customAlphabet } = require('nanoid');
const dict51 = require('nanoid-dictionary/nolookalikes');
const nanoid = customAlphabet(dict51, 20);
const { dir, log, logOk, logWarn, logError } = require('../../extras/console')(modulename);

//Helper functions
const isUndefined = (x) => { return (typeof x === 'undefined') };


/**
 * Returns the output page containing the admins.
 * @param {object} ctx
 */
module.exports = async function AdminManagerActions(ctx) {
    //Sanity check
    if(isUndefined(ctx.params.action)){
        return ctx.utils.error(400, 'Invalid Request');
    }
    let action = ctx.params.action;

    //Check permissions
    if(!ctx.utils.checkPermission('manage.admins', modulename)){
        return ctx.send({
            type: 'danger',
            message: `You don't have permission to execute this action.`
        });
    }

    //Delegate to the specific action handler
    if(action == 'add'){
        return await handleAdd(ctx);
    }else if(action == 'edit'){
        return await handleEdit(ctx);
    }else if(action == 'delete'){
        return await handleDelete(ctx);
    }else if(action == 'getModal'){
        return await handleGetModal(ctx);
    }else{
        return ctx.send({
            type: 'danger',
            message: 'Unknown action.'
        });
    }
};


//================================================================
/**
 * Handle Add
 * @param {object} ctx
 */
async function handleAdd(ctx) {
    //Sanity check
    if(
        typeof ctx.request.body.name !== 'string' ||
        typeof ctx.request.body.citizenfxID !== 'string' ||
        typeof ctx.request.body.discordID !== 'string' ||
        isUndefined(ctx.request.body.permissions)
    ){
        return ctx.utils.error(400, 'Invalid Request - missing parameters');
    }

    //Prepare and filter variables
    let name = ctx.request.body.name.trim();
    let password = nanoid();
    let citizenfxID = ctx.request.body.citizenfxID.trim();
    let discordID = ctx.request.body.discordID.trim();
    let permissions = (Array.isArray(ctx.request.body.permissions))? ctx.request.body.permissions : [];
    permissions = permissions.filter((x)=>{ return typeof x === 'string'});
    if(permissions.includes('all_permissions')) permissions = ['all_permissions'];

    //Validate fields
    if(!/^[a-zA-Z0-9]{6,16}$/.test(name)){
        return ctx.send({type: 'danger', message: "Invalid username"});
    }
    if(citizenfxID.length && !/^\w{3,20}$/.test(citizenfxID)){
        return ctx.send({type: 'danger', message: "Invalid CitizenFX ID"});
    }
    if(discordID.length && !/^\d{7,20}$/.test(discordID)){
        return ctx.send({type: 'danger', message: "Invalid Discord ID"});
    }

    //Add admin and give output
    try {
        await globals.authenticator.addAdmin(name, citizenfxID, discordID, password, permissions);
        let logMessage = `[${ctx.ip}][${ctx.session.auth.username}] Adding admin '${name}'.`;
        logOk(logMessage);
        globals.logger.append(logMessage);
        return ctx.send({type: 'modalrefresh', password});
    } catch (error) {
        return ctx.send({type: 'danger', message: error.message});
    }
}


//================================================================
/**
 * Handle Edit
 * @param {object} ctx
 */
async function handleEdit(ctx) {
    //Sanity check
    if(
        typeof ctx.request.body.name !== 'string' ||
        typeof ctx.request.body.citizenfxID !== 'string' ||
        typeof ctx.request.body.discordID !== 'string' ||
        isUndefined(ctx.request.body.permissions)
    ){
        return ctx.utils.error(400, 'Invalid Request - missing parameters');
    }

    //Prepare and filter variables
    let name = ctx.request.body.name.trim();
    let citizenfxID = ctx.request.body.citizenfxID.trim();
    let discordID = ctx.request.body.discordID.trim();
    let permissions = (Array.isArray(ctx.request.body.permissions))? ctx.request.body.permissions : [];
    permissions = permissions.filter((x)=>{ return typeof x === 'string'});
    if(permissions.includes('all_permissions')) permissions = ['all_permissions'];

    //Validate fields
    if(citizenfxID.length && !/^\w{3,20}$/.test(citizenfxID)){
        return ctx.send({type: 'danger', message: "Invalid CitizenFX ID"});
    }
    if(discordID.length && !/^\d{7,20}$/.test(discordID)){
        return ctx.send({type: 'danger', message: "Invalid Discord ID"});
    }

    //Check if editing himself
    if(ctx.session.auth.username.toLowerCase() === name.toLowerCase()){
        return ctx.send({type: 'danger', message: "You can't edit yourself."});
    }

    //Check if admin exists
    let admin = globals.authenticator.getAdminByName(name);
    if(!admin) return ctx.send({type: 'danger', message: "Admin not found."});

    //Check if editing an master admin
    if(admin.master){
        return ctx.send({type: 'danger', message: "You cannot edit an admin master."});
    }

    //Add admin and give output
    try {
        await globals.authenticator.editAdmin(name, null, citizenfxID, discordID, permissions);
        let logMessage = `[${ctx.ip}][${ctx.session.auth.username}] Editing user '${name}'.`;
        logOk(logMessage);
        globals.logger.append(logMessage);
        return ctx.send({type: 'success', message: `refresh`});
    } catch (error) {
        return ctx.send({type: 'danger', message: error.message});
    }
}


//================================================================
/**
 * Handle Delete
 * @param {object} ctx
 */
async function handleDelete(ctx) {
    //Sanity check
    if(
        isUndefined(ctx.request.body.name) ||
        typeof ctx.request.body.name !== 'string'
    ){
        return ctx.utils.error(400, 'Invalid Request - missing parameters');
    }
    let name = ctx.request.body.name.trim();

    //Check if editing himself
    if(ctx.session.auth.username.toLowerCase() === name.toLowerCase()){
        return ctx.send({type: 'danger', message: "You can't delete yourself."});
    }

    //Check if admin exists
    let admin = globals.authenticator.getAdminByName(name);
    if(!admin) return ctx.send({type: 'danger', message: "Admin not found."});

    //Check if editing an master admin
    if(admin.master){
        return ctx.send({type: 'danger', message: "You cannot delete an admin master."});
    }

    //Delete admin and give output
    try {
        await globals.authenticator.deleteAdmin(name);
        let logMessage = `[${ctx.ip}][${ctx.session.auth.username}] Deleting user '${name}'.`;
        logOk(logMessage);
        globals.logger.append(logMessage);
        return ctx.send({type: 'success', message: `refresh`});
    } catch (error) {
        return ctx.send({type: 'danger', message: error.message});
    }
}


//================================================================
/**
 * Handle Get Modal
 * @param {object} ctx
 */
async function handleGetModal(ctx) {
    //Sanity check
    if(
        isUndefined(ctx.request.body.name) ||
        typeof ctx.request.body.name !== 'string'
    ){
        return ctx.utils.error(400, 'Invalid Request - missing parameters');
    }
    let name = ctx.request.body.name.trim();

    //Check if editing himself
    if(ctx.session.auth.username.toLowerCase() === name.toLowerCase()){
        return ctx.send("You can't edit yourself.");
    }

    //Get admin data
    let admin = globals.authenticator.getAdminByName(name);
    if(!admin) return ctx.send('Admin not found');

    //Check if editing an master admin
    if(admin.master){
        return ctx.send("You cannot edit an admin master.");
    }

    //Prepare permissions
    let allPermissions = globals.authenticator.getPermissionsList();
    let permissions = allPermissions.map((perm) => {
        return {
            name: perm,
            checked: (admin.permissions.includes(perm))? 'checked' : ''
        }
    });

    //Set render data
    let renderData = {
        headerTitle: 'Admin Manager',
        username: admin.name,
        citizenfx_id: (admin.providers.citizenfx)? admin.providers.citizenfx.id : '',
        discord_id: (admin.providers.discord)? admin.providers.discord.id : '',
        permissions: permissions
    }

    //Give output
    return ctx.utils.render('adminManager-editModal', renderData);
}
