
//================================================================
/**
 * Wrapper function to send the output to be shown inside an alert
 * @param {object} ctx
 * @param {string} msg
 */
async function sendAlertOutput(ctx, toResp){
    toResp = (toResp.length)? xss(toResp) : 'no output';
    return ctx.send({
        type: 'warning',
        message: `<b>Output:<br> <pre>${toResp}</pre>`
    });
}


//================================================================
/**
 * Wrapper function to check permission and give output if denied
 * @param {object} ctx
 * @param {string} perm
 */
function ensurePermission(ctx, perm){
    if(ctx.utils.checkPermission(perm, modulename)){
        return true;
    }else{
        ctx.send({
            type: 'danger',
            message: `You don't have permission to execute this action.`
        });
        return false;
    }
}


//Helper functions
const escape = (x) => {return x.replace(/\"/g, '\uff02');};
const formatCommand = (cmd, ...params) => {
    return `${cmd} "` + [...params].map(escape).join(`" "`) + `"`;
};

//==============================================
}else if(action == 'admin_dm'){
    if(!ensurePermission(ctx, 'commands.message')) return false;
    if(!Array.isArray(parameter) || parameter.length !== 2){
        return sendAlertOutput(ctx, 'Invalid request');
    }
    let cmd = formatCommand('txaSendDM', parameter[0], ctx.session.auth.username, parameter[1]);
    ctx.utils.appendLog(cmd);
    let toResp = await globals.fxRunner.srvCmdBuffer(cmd);
    return sendAlertOutput(ctx, toResp);

    //==============================================
}else if(action == 'kick_player'){
    if(!ensurePermission(ctx, 'commands.kick')) return false;
    let cmd;
    if(parameter[1].length){
        cmd = formatCommand('txaKickID', parameter[0], parameter[1]);
    }else{
        cmd = formatCommand('txaKickID', parameter[0]);
    }
    ctx.utils.appendLog(cmd);
    let toResp = await globals.fxRunner.srvCmdBuffer(cmd);
    return sendAlertOutput(ctx, toResp);



// ## Player Controller:
async registerEvent(reference, xxx){
    //Processes target reference
    let identifiers;
    if(Array.isArray(reference)){
        identifiers = reference.filter((id)=>{
            //check if string
            //make sure all ids are valid or throw
        });
    }else if(typeof reference == 'number'){
        let player = this.activePlayers.filter((p) => p.id === reference);
        identifiers = player.identifiers; //FIXME: make sure we are already filtering the identifiers on the processHeartbeat function
    }else{
        throw new Error(`Reference expected to be an array of strings or id. Received '${typeof target}'.`)
    }

    //Prepares db object
    //FIXME: something

    //Saves it to the database
    //FIXME: something

    //Return target id/identifiers
    return identifiers;
}


// ## Commands:
warn_player (id, reason){
    try {
        let identifiers = globals.playerController.registerEvent(id, xxx)
        //execute txaWarn
    } catch (error) {
        //return error message
    }
}

/*
    ## Todas as funções que preciso programar (target type) [pct que precisa de comando]:
        - save note     (license) [0%]
        - warn player   (id/arr) [100%]
        - ban player    (id/arr) [75%]
        - revoke action (actID)  [0%]
        - search        (name, license, csv ids)

    ## Decisões:
        - Mover o kick_player (kick) do commands.js pro actions.js
        - Mover o admin_dm (message) do commands.js pro actions.js
        - criar pasta "players" no webroutes com os arquivos
            - [post] actions (save_note, message*, kick*, warn*, ban*, revoke_action, search)
            - [get] modal
            - [get] list
        

*/
