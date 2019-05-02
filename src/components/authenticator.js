//Requires
const fs = require('fs');
const bcrypt = require('bcrypt');
const { log, logOk, logWarn, logError } = require('../extras/conLog');


module.exports = class Authenticator {
    constructor(config) {
        logOk('::Authenticator Iniciado');
        this.config = config;
        this.context = 'Authenticator';
        this.admins = [];
        this.refreshAdmins();
       
        //Função Cron
        setInterval(() => {
            this.refreshAdmins();
        }, this.config.refreshInterval);
    }


    //================================================================
    //return the userID if the password match, false if doesn't
    checkAuth(hash){
        let admin = this.admins.find((user) => {return bcrypt.compareSync(hash, user.password)})
        return (admin)? admin.name : false;
    }


    //================================================================
    //return the userID if the password match, false if doesn't
    hash(password){
        if(typeof password !== 'string') return false;
        return bcrypt.hashSync(password, 5);
    }


    //================================================================
    async refreshAdmins(){
        try {
            let raw = fs.readFileSync(this.config.adminsFilePath);  
            this.admins = JSON.parse(raw);
            log(`Admins file loaded. Found: ${this.admins.length}`, this.context)
        } catch (error) {
            logError('Unnable to load admins.', this.context);
            this.admins = [];
        }
    }

} //Fim Authenticator()
