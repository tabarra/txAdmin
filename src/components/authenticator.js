//Requires
const fs = require('fs');
const bcrypt = require('bcrypt');
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../extras/console');
const context = 'Authenticator';


module.exports = class Authenticator {
    constructor(config) {
        logOk('::Started', context);
        this.config = config;
        this.admins = [];
        this.refreshAdmins();
       
        //Função Cron
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
        let admin = this.admins.find((user) => {return bcrypt.compareSync(pwd, user.password_hash)})
        return (admin)? admin.name : false;
    }


    //================================================================
    /**
     * Refreshes the admins list
     */
    async refreshAdmins(){
        let raw = null;
        let jsonData = null;

        try {
            raw = fs.readFileSync(this.config.adminsFilePath);  
        } catch (error) {
            logError('Unnable to load admins. (cannot read file)', context);
            this.admins = [];
            return;
        }

        try {
            jsonData = JSON.parse(raw);
        } catch (error) {
            logError('Unnable to load admins. (json parse error)', context);
            this.admins = [];
            return;
        }

        let integrityFailed = jsonData.some((x) =>{
            if(typeof x.name == 'undefined') return true;
            if(typeof x.password_hash == 'undefined') return true;
            if(!x.password_hash.startsWith('$2')) return true;
            return false;
        });
        if(integrityFailed){
            logError('Unnable to load admins. (invalid data in the admins file)', context);
            this.admins = [];
            return;
        }

        if(!jsonData.length){
            logError('Unnable to load admins. (no entries)', context);
            this.admins = [];
            return;
        }

        this.admins = jsonData;
        if(globals.config.verbose) log(`Admins file loaded. Found: ${this.admins.length}`, context);
    }

} //Fim Authenticator()
