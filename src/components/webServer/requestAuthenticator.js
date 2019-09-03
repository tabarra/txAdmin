const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../../extras/console');
const context = 'WebServer:RequestAuthenticator';

/**
 * Returns a session authenticator function
 * @param {string} epType
 */
module.exports = getRequestAuthFunc = (epType) => {
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
        let follow = false;
        if(
            typeof req.session.auth !== 'undefined' &&
            typeof req.session.auth.username !== 'undefined' &&
            typeof req.session.auth.password !== 'undefined'
        ){
            let admin = globals.authenticator.checkAuth(req.session.auth.username, req.session.auth.password);
            if(admin){
                req.session.auth = {
                    username: req.session.auth.username,
                    password: req.session.auth.password,
                    permissions: admin.permissions
                };
                follow = true;
            }
        }

        if(!follow){
            if(globals.config.verbose) logWarn(`Invalid session auth: ${req.originalUrl}`, context);
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

    //Return the appropriate function
    if(epType === 'intercom'){
        return intercomAuth;
    }else if(epType === 'web'){
        return normalAuth;
    }else if(epType === 'api'){
        return normalAuth;
    }else{
        return () => {throw new Error('Unknown auth type')};
    }
}
