//Requires
const modulename = 'WebServer:AdvancedActions';
const fs = require('fs-extra');
const { dir, log, logOk, logWarn, logError } = require('../../extras/console')(modulename);
const helpers = require('../../extras/helpers');

//Helper functions
const isUndefined = (x) => { return (typeof x === 'undefined') };


/**
 * 
 * @param {object} ctx
 */
module.exports = async function AdvancedActions(ctx) {
    //Sanity check
    if(
        isUndefined(ctx.request.body.action) ||
        isUndefined(ctx.request.body.parameter)
    ){
        logWarn('Invalid request!');
        return ctx.send({type: 'danger', message: `<strong>Invalid request :(</strong>`});
    }
    let action = ctx.request.body.action;
    let parameter = ctx.request.body.parameter;


    //Check permissions
    if(!ctx.utils.checkPermission('all_permissions', modulename)){
        return ctx.send({
            type: 'danger',
            message: `You don't have permission to execute this action.`
        });
    }

    //Action: Change Verbosity
    if(action == 'change_verbosity'){
        GlobalData.verbose = (parameter == 'true');
        return ctx.send({refresh:true});

    }else if(action == 'perform_magic'){
        let data = globals.playerController.activePlayers;
        let message = JSON.stringify(data, null, 2);
        return ctx.send({type: 'success', message});
        
    }else if(action == 'perform_magic2'){
        globals.playerController.playerlistGenerator.indexes = [];
        return ctx.send({type: 'success', message: 'clearing generator playerlist'});
    }


    //Catch all
    return ctx.send({type: 'danger', message: `<strong>Unknown action :(</strong>`});
};
