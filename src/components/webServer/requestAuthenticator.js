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
            typeof req.session.auth.expires_at !== 'undefined'
        ){
            let now = Math.round(Date.now()/1000);
            if(req.session.auth.expires_at === false || now > req.session.auth.expires_at){
                try {
                    let admin = globals.authenticator.getAdminData(req.session.auth.username);
                    if(admin){
                        if(
                            typeof req.session.auth.password_hash == 'string' &&
                            typeof admin.password_hash == 'string' &&
                            admin.password_hash == req.session.auth.password_hash
                        ){
                            follow = true;
                        }else if(typeof req.session.auth.provider == 'string'){
                            follow = true;
                        }
                    }
                } catch (error) {
                    if(globals.config.verbose) logError(`Error validating session data:`, context);
                    if(globals.config.verbose) dir(error);
                }
            }else{
                if(globals.config.verbose) logWarn(`Expired session from ${req.session.auth.username}`, context);
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
