//Requires
const nanoidGen = require('nanoid/generate');
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../../extras/console');
const context = 'WebServer:AdminManager-Actions';

//Helper functions
const isUndefined = (x) => { return (typeof x === 'undefined') };
const genNewPassword = () => { return nanoidGen('123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz', 12); };

/**
 * Returns the output page containing the admins.
 * @param {object} res
 * @param {object} req
 */
module.exports = async function action(res, req) {
    //Sanity check
    if(isUndefined(req.params.action)){
        res.status(400).send({status: 'error', error: "Invalid Request"});
        return;
    }
    let action = req.params.action;

    //Check permissions
    if(!webUtils.checkPermission(req, 'manage.admins', context)){
        return res.send({
            type: 'danger',
            message: `You don't have permission to execute this action.`
        });
    }

    //Delegate to the specific action handler
    if(action == 'add'){
        return await handleAdd(res, req);
    }else if(action == 'edit'){
        return await handleEdit(res, req);
    }else if(action == 'delete'){
        return await handleDelete(res, req);
    }else if(action == 'getModal'){
        return await handleGetModal(res, req);
    }else{
        return res.send({
            type: 'danger',
            message: 'Unknown action.'
        });
    }
};


//================================================================
/**
 * Handle Add
 * @param {object} res
 * @param {object} req
 */
async function handleAdd(res, req) {
    //Sanity check
    if(
        typeof req.body.name !== 'string' ||
        typeof req.body.citizenfxID !== 'string' ||
        typeof req.body.discordID !== 'string' ||
        isUndefined(req.body.permissions)
    ){
        return res.status(400).send({type: 'danger', message: "Invalid Request - missing parameters"});
    }

    //Prepare and filter variables
    let name = req.body.name.trim();
    let password = genNewPassword();
    let citizenfxID = req.body.citizenfxID.trim();
    let discordID = req.body.discordID.trim();
    let permissions = (Array.isArray(req.body.permissions))? req.body.permissions : [];
    permissions = permissions.filter((x)=>{ return typeof x === 'string'});
    if(permissions.includes('all_permissions')) permissions = ['all_permissions'];

    //Validate fields
    if(!/^[a-zA-Z0-9]{6,16}$/.test(name)){
        return res.send({type: 'danger', message: "Invalid username"});
    }
    if(citizenfxID.length && !/^\w{4,20}$/.test(citizenfxID)){
        return res.send({type: 'danger', message: "Invalid CitizenFX ID"});
    }
    if(discordID.length && !/^\d+$/.test(discordID)){
        return res.send({type: 'danger', message: "Invalid Discord ID"});
    }

    //Add admin and give output
    try {
        await globals.authenticator.addAdmin(name, citizenfxID, discordID, password, permissions);
        let logMessage = `[${req.connection.remoteAddress}][${req.session.auth.username}] Adding admin '${name}'.`;
        logOk(logMessage, context);
        globals.logger.append(logMessage);
        return res.send({type: 'modalrefresh', password});
    } catch (error) {
        return res.send({type: 'danger', message: error.message});
    }
}


//================================================================
/**
 * Handle Edit
 * @param {object} res
 * @param {object} req
 */
async function handleEdit(res, req) {
    //Sanity check
    if(
        typeof req.body.name !== 'string' ||
        typeof req.body.citizenfxID !== 'string' ||
        typeof req.body.discordID !== 'string' ||
        isUndefined(req.body.permissions)
    ){
        return res.status(400).send({type: 'danger', message: "Invalid Request - missing parameters"});
    }

    //Prepare and filter variables
    let name = req.body.name.trim();
    let citizenfxID = req.body.citizenfxID.trim();
    let discordID = req.body.discordID.trim();
    let permissions = (Array.isArray(req.body.permissions))? req.body.permissions : [];
    permissions = permissions.filter((x)=>{ return typeof x === 'string'});
    if(permissions.includes('all_permissions')) permissions = ['all_permissions'];

    //Validate fields
    if(citizenfxID.length && !/^\w{4,20}$/.test(citizenfxID)){
        return res.send({type: 'danger', message: "Invalid CitizenFX ID"});
    }
    if(discordID.length && !/^\d+$/.test(discordID)){
        return res.send({type: 'danger', message: "Invalid Discord ID"});
    }

    //Check permissions
    if(req.session.auth.username.toLowerCase() === name.toLowerCase()){
        return res.send({type: 'danger', message: "You can't edit yourself."});
    }

    //Add admin and give output
    try {
        await globals.authenticator.editAdmin(name, null, citizenfxID, discordID, permissions);
        let logMessage = `[${req.connection.remoteAddress}][${req.session.auth.username}] Editing user '${name}'.`;
        logOk(logMessage, context);
        globals.logger.append(logMessage);
        return res.send({type: 'success', message: `refresh`});
    } catch (error) {
        return res.send({type: 'danger', message: error.message});
    }
}


//================================================================
/**
 * Handle Delete
 * @param {object} res
 * @param {object} req
 */
async function handleDelete(res, req) {
    //Sanity check
    if(
        isUndefined(req.body.name) ||
        typeof req.body.name !== 'string'
    ){
        return res.status(400).send({type: 'danger', message: "Invalid Request - missing parameters"});
    }
    let name = req.body.name.trim();

    //Check permissions
    if(req.session.auth.username.toLowerCase() === name.toLowerCase()){
        return res.send({type: 'danger', message: "You can't delete yourself."});
    }

    //Delete admin and give output
    try {
        await globals.authenticator.deleteAdmin(name);
        let logMessage = `[${req.connection.remoteAddress}][${req.session.auth.username}] Deleting user '${name}'.`;
        logOk(logMessage, context);
        globals.logger.append(logMessage);
        return res.send({type: 'success', message: `refresh`});
    } catch (error) {
        return res.send({type: 'danger', message: error.message});
    }
}


//================================================================
/**
 * Handle Get Modal
 * @param {object} res
 * @param {object} req
 */
async function handleGetModal(res, req) {
    //Sanity check
    if(
        isUndefined(req.body.name) ||
        typeof req.body.name !== 'string'
    ){
        return res.status(400).send({type: 'danger', message: "Invalid Request - missing parameters"});
    }

    //Get admin data
    let admin = globals.authenticator.getAdminByName(req.body.name);
    if(!admin) return res.send('Admin not found');

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
    let out = await webUtils.renderSoloView('adminManager-editModal', renderData);
    return res.send(out);
}
