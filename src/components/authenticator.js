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
     * Search the admins list and try to match the password. Returns the user if there's a match, or false.
     * @param {string} uname 
     * @param {string} pwd 
     * @returns {(object|boolean)} admin user or false
     */
    checkAuth(uname, pwd){
        let username = uname.toLowerCase();
        let admin = this.admins.find((user) => {
            return (username === user.name.toLowerCase() && bcrypt.compareSync(pwd, user.password_hash))
        });
        return (admin)? admin : false;
    }


    //================================================================
    /**
     * Refreshes the admins list
     * NOTE: The verbosity here is driving me insane. 
     *       But still seems not to be enough for people that don't read the README.
     */
    async refreshAdmins(){
        let raw = null;
        let jsonData = null;

        try {
            raw = fs.readFileSync(this.config.adminsFilePath, 'utf8');  
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
            if(typeof x.permissions === 'undefined' || !Array.isArray(x.permissions)) return true;
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
