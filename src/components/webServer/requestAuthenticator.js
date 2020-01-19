const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../../extras/console');
const context = 'WebServer:RequestAuthenticator';
const getCtx = (c) => { return `${context}:${c}`};


/**
 * Returns a session authenticator function
 * @param {string} epType type of consumer
 * @param {string} context context for the error messages
 */
const requestAuth = (epType) => {
    //Intercom auth function
    const intercomAuth = (req, res, next) => {
        if(
            typeof req.body.txAdminToken !== 'undefined' &&
            req.body.txAdminToken === globals.webServer.intercomToken
        ){
            next();
        }else{
            res.send({error: 'invalid token'})
        }
    }

    //Normal auth function
    const normalAuth = (req, res, next) =>{
        const {isValidAuth} = authLogic(req.session, true, getCtx(epType));

        if(!isValidAuth){
            if(globals.config.verbose) logWarn(`Invalid session auth: ${req.originalUrl}`, getCtx(epType));
            req.session.auth = {};
            if(epType === 'web'){
                return res.redirect('/auth?logout');
            }else if(epType === 'api'){
                return res.send({logout:true});
            }else{
                return () => {throw new Error('Unknown auth type')};
            }
        }else{
            next();
        }
    }

    //Socket auth function
    const socketAuth = (socket, next) =>{
        const {isValidAuth} = authLogic(socket.handshake.session, true, getCtx(epType));

        if(isValidAuth){
            next();
        }else{
            socket.handshake.session.auth = {}; //a bit redundant but it wont hurt anyone
            socket.disconnect(0);
            if(globals.config.verbose) logWarn('Auth denied when creating session', context);
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
const authLogic = (sess, perm, ctx) => {
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
                        typeof admin.password_hash == 'string' &&
                        admin.password_hash == sess.auth.password_hash
                    ){
                        isValidAuth = true;
                    }else if(typeof sess.auth.provider == 'string'){
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
                if(globals.config.verbose) logError(`Error validating session data:`, getCtx(ctx));
                if(globals.config.verbose) dir(error);
            }
        }else{
            if(globals.config.verbose) logWarn(`Expired session from ${sess.auth.username}`, getCtx(ctx));
        }
    }

    return {isValidAuth, isValidPerm};
}


//================================================================
module.exports = {
    requestAuth,
    authLogic
}
