//Requires
const modulename = 'WebServer:AdvancedActions';
const fs = require('fs-extra');
const { dir, log, logOk, logWarn, logError } = require('../../extras/console')(modulename);
const helpers = require('../../extras/helpers');

//Helper functions
const isUndefined = (x) => { return (typeof x === 'undefined') };
const now = () => { return Math.round(Date.now() / 1000) };


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

    }else if(action == 'perform_magic3'){
        if(globals.playerController.playerlistGenerator.indexes.length){
            globals.playerController.playerlistGenerator.indexes = [];
        }else{
            globals.playerController.playerlistGenerator.indexes = [0, 1];
        }
        return ctx.send({type: 'success', message: `kick'em all, or unkick'em all`});

    }else if(action == 'perform_magic4'){
        let idArray = ["license:23fb884f1463da603330b9d4434f2886a725aaaa"];
        let ts = now();
        const filter = (x) => {
            return (
                // (x.type == 'ban') &&
                (x.type == 'ban' || x.type == 'whitelist') &&
                (!x.expiration || x.expiration > ts) &&
                (!x.revocation.timestamp)
            );
        }

        let hist = await globals.playerController.getRegisteredActions(idArray, filter);
        return ctx.send({type: 'success', message: JSON.stringify(hist, null, 2)});

    }else if(action == 'show_db'){
        let dbo = globals.playerController.getDB();
        dir(dbo);
        return ctx.send({type: 'success', message: JSON.stringify(dbo, null, 2)});
        
    }else if(action == 'show_log'){
        return ctx.send({type: 'success', message: JSON.stringify(globals.databus.serverLog, null, 2)})
    }


    //Catch all
    return ctx.send({type: 'danger', message: `<strong>Unknown action :(</strong>`});
};
