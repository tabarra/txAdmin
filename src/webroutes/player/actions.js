//Requires
const modulename = 'WebServer:PlayerActions';
const { dir, log, logOk, logWarn, logError } = require('../../extras/console')(modulename);

//Helper functions 
//FIXME: review
const escape = (x) => {return x.replace(/\"/g, '\\"');};
const isUndefined = (x) => { return (typeof x === 'undefined') };
const handleError = (ctx, error)=>{
    logError(`Database operation failed with error: ${error.message}`);
    if(GlobalData.verbose) dir(error);
    return ctx.send({
        type: 'danger',
        message: `Error executing this action, please copy the error on the terminal and report in the Discord Server.`
    });
}


/**
 * Returns the output page containing the bans experiment
 * @param {object} ctx
 */
module.exports = async function PlayerActions(ctx) {
    //Sanity check
    if(isUndefined(ctx.params.action)){
        return ctx.utils.error(400, 'Invalid Request');
    }
    let action = ctx.params.action;

    //Delegate to the specific action handler
    if(action === 'save_note'){
        return await handleXXXXX(ctx);
    }else if(action === 'message'){
        return await handleXXXXX(ctx);
    }else if(action === 'unban'){
        return await handleXXXXX(ctx);
    }else if(action === 'kick'){
        return await handleXXXXX(ctx);
    }else if(action === 'warn'){
        return await handleXXXXX(ctx);
    }else if(action === 'ban'){
        return await handleXXXXX(ctx);
    }else if(action === 'revoke_action'){
        return await handleXXXXX(ctx);
    }else if(action === 'search'){
        return await handleXXXXX(ctx);
    }else{
        return ctx.send({
            type: 'danger',
            message: 'Unknown action.'
        });
    }
};


//================================================================
/**
 * Handle XXXXX
 * @param {object} ctx
 */
async function handleXXXXX(ctx) {
    //Checking request
    if(isUndefined(ctx.request.body.yyyyy)){
        return ctx.send({type: 'danger', message: 'Invalid request.'});
    }
    let yyyyy = ctx.request.body.yyyyy.trim().toLowerCase();

    //Check permissions
    if(!ctx.utils.checkPermission('all_permissions', modulename)){
        return ctx.send({
            type: 'danger',
            message: `You don't have permission to execute this action.`
        });
    }

    //TODO: actually code things
}

