//Requires
const modulename = 'WebServer:DeployerActions';
const { dir, log, logOk, logWarn, logError } = require('../../extras/console')(modulename);

//Helper functions
const isUndefined = (x) => { return (typeof x === 'undefined') };


/**
 * Handle all the server control actions
 * @param {object} ctx
 */
module.exports = async function DeployerActions(ctx) {
    //Sanity check
    if(isUndefined(ctx.params.action)){
        return ctx.utils.error(400, 'Invalid Request');
    }
    const action = ctx.params.action;

    //Check permissions
    if(!ctx.utils.checkPermission('all_permissions', modulename)){
        return ctx.send({success: false, refresh: true});
    }

    //Check if this is the correct state for the deployer
    if(globals.deployer == null){
        return ctx.send({success: false, refresh: true});
    }
    //FIXME: some checking to see if the deployer can continue 


    //Delegate to the specific action functions
    if(action == 'run'){
        return await handleRunRecipe(ctx);
    }else if(action == 'commit'){
        return await handleCommitRecipe(ctx);
    }else if(action == 'cancel'){
        return await handleCancel(ctx);
    }else{
        return ctx.send({
            type: 'danger', 
            message: 'Unknown setup action.'
        });
    }
};


//================================================================
/**
 * Handle submition of user-edited recipe (record to deployer, starts the process)
 * @param {object} ctx
 */
async function handleRunRecipe(ctx) {
    //Sanity check
    if(isUndefined(ctx.request.body.recipe)){
        return ctx.utils.error(400, 'Invalid Request - missing parameters');
    }
    const userEditedRecipe = ctx.request.body.recipe;

    try {
        globals.deployer.start(userEditedRecipe)
    } catch (error) {
        return ctx.send({type: 'danger', message: error.message});
    }

    return ctx.send({success: true});
}


//================================================================
/**
 * Handle the commit of a Recipe by receiving the user edited server.cfg
 * @param {object} ctx
 */
async function handleCommitRecipe(ctx) {
    //Sanity check
    if(isUndefined(ctx.request.body.settingsCFG)){
        return ctx.utils.error(400, 'Invalid Request - missing parameters');
    }
    const userEditedConfig = ctx.request.body.settingsCFG;
    dir(userEditedConfig)
    //FIXME: add magic in here

    return ctx.send({type: 'danger', message: 'TODO handleCommitRecipe'});
}


//================================================================
/**
 * Handle the cancellation of the deployer proguess 
 * @param {object} ctx
 */
async function handleCancel(ctx) {
    //FIXME: add magic in here
    // reset fxrunner settings

    return ctx.send({success: true});  
}
