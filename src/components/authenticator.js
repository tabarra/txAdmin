//Requires
const fs = require('fs');
const bcrypt = require('bcrypt');
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../extras/console');
const context = 'Authenticator';


module.exports = class Authenticator {
    constructor(config) {
        logOk('::Iniciado', context);
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
     * @param {string} hash 
     * @returns {(number|boolean)} userid or false
     */
    checkAuth(hash){
        let admin = this.admins.find((user) => {return bcrypt.compareSync(hash, user.password)})
        return (admin)? admin.name : false;
    }


    //================================================================
    /**
     * Hashes a string.
     * @param {string} password 
     * @returns {string} bcrypt hash
     */
    hash(password){
        if(typeof password !== 'string') return false;
        return bcrypt.hashSync(password, 5);
    }


    //================================================================
    /**
     * Refreshes the admins list
     */
    async refreshAdmins(){
        try {
            let raw = fs.readFileSync(this.config.adminsFilePath);  
            this.admins = JSON.parse(raw);
            log(`Admins file loaded. Found: ${this.admins.length}`, context)
        } catch (error) {
            logError('Unnable to load admins.', context);
            this.admins = [];
        }
    }

} //Fim Authenticator()
