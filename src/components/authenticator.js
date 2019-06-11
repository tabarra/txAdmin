//Requires
const fs = require('fs');
const bcrypt = require('bcrypt');
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../extras/console');
const context = 'Authenticator';


module.exports = class Authenticator {
    constructor(config) {
        logOk('::Started', context);
        this.config = config;
        this.admins = null;
        this.refreshAdmins();
       
        //Cron Function
        setInterval(() => {
            this.refreshAdmins();
        }, this.config.refreshInterval);
    }


    //================================================================
    /**
     * Search the admins list and try to match the password. Returns the userid if there's a match, or false.
     * @param {string} pwd 
     * @returns {(number|boolean)} userid or false
     */
    checkAuth(pwd){
        let admin = this.admins.find((user) => {return bcrypt.compareSync(pwd, user.password_hash)});
        return (admin)? admin.name : false;
    }


    //================================================================
    /**
     * [WEB] Checks session to make sure the credentials are valid and set the admin variable.
     * @param {object} req 
     * @param {object} res 
     * @param {function} next 
     */
    sessionCheckerWeb(req, res, next){
        if(typeof req.session.password !== 'undefined'){
            //FIXME: using this.checkAuth() isnt working
            let admin = globals.authenticator.checkAuth(req.session.password);
            if(!admin){
                req.session.destroy(); //a bit redundant but it wont hurt anyone
                res.redirect('/auth?logout');
            }else{
                req.session.admin = admin;
                next();
            }
        }else{
            res.redirect('/auth');
        }  
    };

    
    //================================================================
    /**
     * [API] Checks session to make sure the credentials are valid and set the admin variable.
     * @param {object} req 
     * @param {object} res 
     * @param {function} next 
     */
    sessionCheckerAPI(req, res, next){
        if(typeof req.session.password !== 'undefined'){
            //FIXME: using this.checkAuth() isnt working
            let admin = globals.authenticator.checkAuth(req.session.password);
            if(!admin){
                req.session.destroy(); //a bit redundant but it wont hurt anyone
                res.send({logout:true});
            }else{
                req.session.admin = admin;
                next();
            }
        }else{
            res.send({logout:true});
        }  
    };


    //================================================================
    /**
     * [SOCKET] Checks session to make sure the credentials are valid and set the admin variable.
     * @param {object} req 
     * @param {object} res 
     * @param {function} next 
     */
    sessionCheckerSocket(socket, next){
        if(typeof socket.handshake.session.password !== 'undefined'){
            //FIXME: using this.checkAuth() isnt working
            let admin = globals.authenticator.checkAuth(socket.handshake.session.password);
            if(!admin){
                socket.handshake.session.destroy(); //a bit redundant but it wont hurt anyone
                socket.disconnect(0);
                next(new Error('Authentication error'));
            }else{
                socket.handshake.session.admin = admin;
                next();
            }
        }else{
            socket.disconnect(0);
            next(new Error('Authentication error'));
        }  
    };


    //================================================================
    /**
     * Refreshes the admins list
     * NOTE: The verbosity here is driving me insane. 
     *          But still seems not to be enough for people that don't read the README.
     *          Will separate the hash integrity and stop there.
     */
    async refreshAdmins(){
        let raw = null;
        let jsonData = null;

        try {
            raw = fs.readFileSync(this.config.adminsFilePath);  
        } catch (error) {
            logError('Unable to load admins. (cannot read file, please read the documentation)', context);
            if(this.admins === null) process.exit();
            this.admins = [];
            return;
        }

        try {
            jsonData = JSON.parse(raw);
        } catch (error) {
            logError('Unable to load admins. (json parse error, please read the documentation)', context);
            if(this.admins === null) process.exit();
            this.admins = [];
            return;
        }

        if(!Array.isArray(jsonData)){
            logError('Unable to load admins. (not an array, please read the documentation)', context);
            if(this.admins === null) process.exit(0);
            this.admins = [];
            return;
        }

        let structureIntegrityTest = jsonData.some((x) =>{
            if(typeof x.name === 'undefined' || typeof x.name !== 'string') return true;
            if(typeof x.password_hash === 'undefined' || typeof x.password_hash !== 'string') return true;
            return false;
        });
        if(structureIntegrityTest){
            logError('Unable to load admins. (invalid data in the admins file, please read the documentation)', context);
            if(this.admins === null) process.exit();
            this.admins = [];
            return;
        }

        let hashIntegrityTest = jsonData.some((x) =>{
            if(!x.password_hash.startsWith('$2')) return true;
            return false;
        });
        if(hashIntegrityTest){
            logError('Unable to load admins. (invalid hash, please read the documentation)', context);
            if(this.admins === null) process.exit();
            this.admins = [];
            return;
        }

        if(!jsonData.length){
            logError('Unable to load admins. (no entries, please read the documentation)', context);
            if(this.admins === null) process.exit();
            this.admins = [];
            return;
        }

        this.admins = jsonData;
        if(globals.config.verbose) log(`Admins file loaded. Found: ${this.admins.length}`, context);
    }

} //Fim Authenticator()
