//Requires
const fs = require('fs-extra');
const clone = require('clone');
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../../extras/console');
const CitizenFXProvider = require('./providers/CitizenFX');
const context = 'Authenticator';


module.exports = class Authenticator {
    constructor(config, dataPath) {
        logOk('::Started', context);
        this.config = config;
        this.adminsFile = `${dataPath}/admins.json`; //NOTE: remove when adding support for multi-server
        this.admins = null;
        this.registeredPermissions = [
            "all_permissions",
            "manage.admins",
            "settings.view",
            "settings.write",
            "control.server",
            "commands.resources",
            "commands.kick",
            "commands.message",
            "commands.custom",
            "console.view",
            "console.write",
            "server.cfg.editor",
        ];

        //Load providers
        try {
            this.providers = {
                discord: 'xxxxx',
                citizenfx: new CitizenFXProvider(null)
            }
        } catch (error) {
            throw new Error(`Failed to load providers with error: ${error.message}`);
        }

        //Check if admins file exists
        let adminFileExists;
        try {
            adminFileExists = fs.existsSync(this.adminsFile);
        } catch (error) {
            throw new Error(`Failed to check presence of admin file with error: ${error.message}`);
        }

        //Printing PIN or starting loop
        if (!adminFileExists) {
            this.addMasterPin = (Math.random()*10000).toFixed().padStart(4, '0');
            let sep = `=`.repeat(42);
            log(sep, context);
            log('==> Admins file not found.', context);
            log(`==> PIN to add a master account: ${this.addMasterPin}`, context);
            log(sep, context);
            this.admins = false;
        }else{
            this.refreshAdmins(true);
            //Cron Function
            setInterval(() => {
                this.refreshAdmins();
            }, this.config.refreshInterval);
        }
    }


    //================================================================
    /**
     * Creates a admins.json file based on the first account
     * @param {*} username
     * @param {*} provider_data
     * @param {*} password backup password
     * @returns {(boolean)} true or throws an error
     */
    async createAdminsFile(username, provider_data, password){
        //Check if admins file already exist
        if(this.admins != false) throw new Error("Admins file already exists.");

        //Creating admin array
        this.admins = [{
            name: username,
            master: true,
            provider: 'citizenfx',
            provider_data,
            password_hash: GetPasswordHash(password)
        }];
        dir(this.admins)

        //Saving admin file
        try {
            let json = JSON.stringify(this.admins, null, 2);
            await fs.writeFile(this.adminsFile, json, {encoding: 'utf8', flag: 'wx'});
            return true;
        } catch (error) {
            let message = `Failed to create '${this.adminsFile}' with error: ${error.message}`;
            if(globals.config.verbose) logError(message, context);
            throw new Error(message);
        }
    }


    //================================================================
    /**
     * Returns a list of admins and permissions
     */
    getAdmins(){
        if(this.admins == false) return [];
        return this.admins.map((user) => {
            return {name: user.name, permissions: user.permissions};
        });
    }


    //================================================================
    /**
     * Returns all data from an admin or false
     * @param {string} uname
     */
    getAdminData(uname){
        if(this.admins == false) return false;
        let username = uname.trim().toLowerCase();
        let admin = this.admins.find((user) => {
            return (username === user.name.toLowerCase())
        });
        return (admin)? admin : false;
    }


    //================================================================
    /**
     * Returns a list with all registered permissions
     */
    getPermissionsList(){
        return clone(this.registeredPermissions);
    }


    //================================================================
    /**
     * Add a new admin to the admins file
     * @param {*} name
     * @param {*} password
     * @param {*} permissions
     */
    async addAdmin(name, password, permissions){
        if(this.admins == false) throw new Error("Admins not set");

        //Check if username is already taken
        let username = name.toLowerCase();
        let existing = this.admins.find((user) => {
            return (username === user.name.toLowerCase())
        });
        if(existing) throw new Error("Username already taken");

        //Adding new admin
        this.admins.push({
            name: name,
            password_hash: bcrypt.hashSync(password, 5),
            permissions: permissions,
        })

        //Saving admin file
        try {
            await fs.writeFile(this.adminsFile, JSON.stringify(this.admins, null, 2), 'utf8');
            return true;
        } catch (error) {
            if(globals.config.verbose) logError(error.message, context);
            throw new Error(`Failed to save '${this.adminsFile}'`);
        }
    }


    //================================================================
    /**
     * Edit admin and save to the admins file
     * @param {*} name
     * @param {*} password
     * @param {*} permissions
     */
    async editAdmin(name, password, permissions){
        if(this.admins == false) throw new Error("Admins not set");

        //Find admin index
        let username = name.toLowerCase();
        let adminIndex = this.admins.findIndex((user) => {
            return (username === user.name.toLowerCase())
        });
        if(adminIndex == -1) throw new Error("Admin not found");

        //Editing admin
        if(password) this.admins[adminIndex].password_hash = bcrypt.hashSync(password, 5);
        if(typeof permissions !== 'undefined') this.admins[adminIndex].permissions = permissions;

        //Saving admin file
        try {
            await fs.writeFile(this.adminsFile, JSON.stringify(this.admins, null, 2), 'utf8');
            return true;
        } catch (error) {
            if(globals.config.verbose) logError(error.message, context);
            throw new Error(`Failed to save '${this.adminsFile}'`);
        }
    }


    //================================================================
    /**
     * Delete admin and save to the admins file
     * @param {*} name
     */
    async deleteAdmin(name){
        if(this.admins == false) throw new Error("Admins not set");

        //Delete admin
        let username = name.toLowerCase();
        let found = false;
        this.admins = this.admins.filter((user) => {
            if(username !== user.name.toLowerCase()){
                return true;
            }else{
                found = true;
                return false;
            }
        });
        if(!found) throw new Error("Admin not found");

        //Saving admin file
        try {
            await fs.writeFile(this.adminsFile, JSON.stringify(this.admins, null, 2), 'utf8');
            return true;
        } catch (error) {
            if(globals.config.verbose) logError(error.message, context);
            throw new Error(`Failed to save '${this.adminsFile}'`);
        }
    }

    //================================================================
    /**
     * Refreshes the admins list
     * NOTE: The verbosity here is driving me insane.
     *       But still seems not to be enough for people that don't read the README.
     */
    async refreshAdmins(isFirstTime = false){
        let raw = null;
        let jsonData = null;

        const callError = (x) => {
            logError(`Unable to load admins. (${x}, please read the documentation)`, context);
            if(isFirstTime) process.exit();
            this.admins = [];
            return false;
        }

        try {
            raw = await fs.readFile(this.adminsFile, 'utf8');
        } catch (error) {
            return callError('cannot read file');
        }

        try {
            jsonData = JSON.parse(raw);
        } catch (error) {
            return callError('json parse error');
        }

        if(!Array.isArray(jsonData)){
            return callError('not an array');
        }

        let structureIntegrityTest = jsonData.some((x) =>{
            if(typeof x.name !== 'string') return true;
            if(typeof x.provider === 'object' || !Object.keys(this.providers).includes(x.provider)) return true;
            if(typeof x.provider_data !== 'object') return true;
            if(typeof x.master !== 'undefined' && x.master === true){
                if(typeof x.password_hash !== 'string') return true;
            }else{
                if(typeof x.permissions === 'undefined' || !Array.isArray(x.permissions)) return true;
            }
            if(x.provider_id == 'password' && (typeof x.password_hash !== 'string'))  return true;
            return false;
        });
        if(structureIntegrityTest){
            return callError('invalid data in the admins file');
        }

        let masterCount = jsonData.filter((x) => { return x.master }).length;
        if(masterCount !== 1){
            return callError('must have exactly 1 master account');
        }

        let hashIntegrityTest = jsonData.some((x) =>{
            return (typeof x.password_hash === 'string' && !x.password_hash.startsWith('$2'));
        });
        if(hashIntegrityTest){
            return callError('invalid hash');
        }

        if(!jsonData.length){
            return callError('no entries');
        }

        this.admins = jsonData;
        if(globals.config.verbose) log(`Admins file loaded. Found: ${this.admins.length}`, context);
        return true;
    }

} //Fim Authenticator()
