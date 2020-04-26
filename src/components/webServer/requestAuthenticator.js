const modulename = 'WebServer:RequestAuthenticator';
const { dir, log, logOk, logWarn, logError } = require('../../extras/console')(modulename);


/**
 * Returns a session authenticator function
 * @param {string} epType type of consumer
 */
const requestAuth = (epType) => {
    //Intercom auth function
    const intercomAuth = async (ctx, next) => {
        if(
            typeof ctx.request.body.txAdminToken !== 'undefined' &&
            ctx.request.body.txAdminToken === globals.webServer.intercomToken
        ){
            await next();
        }else{
            return ctx.send({error: 'invalid token'})
        }
    }

    //Normal auth function
    const normalAuth = async (ctx, next) =>{
        const {isValidAuth} = authLogic(ctx.session, true, epType);

        if(!isValidAuth){
            if(GlobalData.verbose) logWarn(`Invalid session auth: ${ctx.path}`, epType);
            ctx.session.auth = {};
            if(epType === 'web'){
                return ctx.response.redirect('/auth?logout');
            }else if(epType === 'api'){
                return ctx.send({logout:true});
            }else{
                return () => {throw new Error('Unknown auth type')};
            }
        }else{
            await next();
        }
    }

    //Socket auth function
    const socketAuth = async (socket, next) =>{
        const {isValidAuth} = authLogic(socket.session, true, epType);

        if(isValidAuth){
            await next();
        }else{
            socket.session.auth = {}; //a bit redundant but it wont hurt anyone
            socket.disconnect(0);
            if(GlobalData.verbose) logWarn('Auth denied when creating session');
            next(new Error('Authentication Denied'));
        }
    }

    //Return the appropriate function
    if(epType === 'intercom'){
        return intercomAuth;
    }else if(epType === 'web'){
        return normalAuth;
    }else if(epType === 'api'){
        return normalAuth;
    }else if(epType === 'socket'){
        return socketAuth;
    }else{
        return () => {throw new Error('Unknown auth type')};
    }
}


/**
 * Autentication & authorization logic used in both websocket and webserver
 * @param {*} sess
 * @param {*} perm
 * @param {*} ctx
 */
const authLogic = (sess, perm, epType) => {
    let isValidAuth = false;
    let isValidPerm = false;
    if(
        typeof sess.auth !== 'undefined' &&
        typeof sess.auth.username !== 'undefined' &&
        typeof sess.auth.expires_at !== 'undefined'
    ){
        let now = Math.round(Date.now()/1000);
        if(sess.auth.expires_at === false || now < sess.auth.expires_at){
            try {
                let admin = globals.authenticator.getAdminByName(sess.auth.username);
                if(admin){
                    if(
                        typeof sess.auth.password_hash == 'string' &&
                        admin.password_hash == sess.auth.password_hash
                    ){
                        isValidAuth = true;
                    }else if(
                        typeof sess.auth.provider == 'string' &&
                        typeof admin.providers[sess.auth.provider] == 'object' &&
                        sess.auth.provider_uid == admin.providers[sess.auth.provider].id
                    ){
                        isValidAuth = true;
                    }

                    sess.auth.master = admin.master;
                    sess.auth.permissions = admin.permissions;
                    sess.auth.isTempPassword = (typeof admin.password_temporary !== 'undefined');

                    isValidPerm = (perm === true || (
                        admin.master === true ||
                        admin.permissions.includes('all_permissions') ||
                        admin.permissions.includes(perm)
                    ));
                }
            } catch (error) {
                if(GlobalData.verbose) logError(`Error validating session data:`, epType);
                if(GlobalData.verbose) dir(error);
            }
        }else{
            if(GlobalData.verbose) logWarn(`Expired session from ${sess.auth.username}`, epType);
        }
    }

    return {isValidAuth, isValidPerm};
}


//================================================================
module.exports = {
    requestAuth,
    authLogic
}
