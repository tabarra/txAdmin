//Requires
const modulename = 'Authenticator';
const ac = require('ansi-colors');
const fs = require('fs-extra');
const clone = require('clone');
const { dir, log, logOk, logWarn, logError } = require('../../extras/console')(modulename);
const CitizenFXProvider = require('./providers/CitizenFX');


module.exports = class Authenticator {
    constructor(config) {
        logOk('Started');
        this.config = config;
        this.adminsFile = `${GlobalData.dataPath}/admins.json`;
        this.admins = null;
        this.registeredPermissions = [
            "all_permissions",
            "manage.admins",
            "commands.ban",
            "commands.kick",
            "commands.message",
            "commands.resources",
            "commands.warn",
            "console.view",
            "console.write",
            "control.server",
            "server.cfg.editor",
            "settings.view",
            "settings.write",
            "txadmin.log.view",
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
            log(sep);
            log('==> Admins file not found.');
            log(`==> PIN to add a master account: ` + ac.inverse(' ' + this.addMasterPin + ' '));
            log(sep);
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
            password_hash: GetPasswordHash(password),
            providers: {
                citizenfx: {
                    id: username,
                    data: provider_data
                }
            },
            permissions: []
        }];

        //Saving admin file
        try {
            let json = JSON.stringify(this.admins, null, 2);
            await fs.writeFile(this.adminsFile, json, {encoding: 'utf8', flag: 'wx'});
            return true;
        } catch (error) {
            let message = `Failed to create '${this.adminsFile}' with error: ${error.message}`;
            if(GlobalData.verbose) logError(message);
            throw new Error(message);
        }
    }


    //================================================================
    /**
     * Returns a list of admins and permissions
     */
    getAdminsList(){
        if(this.admins == false) return [];
        return this.admins.map((user) => {
            let out = {
                name: user.name,
                master: user.master,
                providers: Object.keys(user.providers),
                permissions: user.permissions
            }
            return out;
        });
    }


    //================================================================
    /**
     * Returns all data from an admin by provider user id (ex discord id), or false
     * @param {string} uid
     */
    getAdminByProviderUID(uid){
        if(this.admins == false) return false;
        let id = uid.trim().toLowerCase();
        let admin = this.admins.find((user) => {
            return Object.keys(user.providers).find((provider) => {
                return (id === user.providers[provider].id.toLowerCase())
            })
        });
        return (admin)? admin : false;
    }


    //================================================================
    /**
     * Returns all data from an admin by their name, or false
     * @param {string} uname
     */
    getAdminByName(uname){
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
     * NOTE: I'm fully aware this coud be optimized. Leaving this way to improve readability and error verbosity
     * @param {string} name
     * @param {string} citizenfxID
     * @param {string} discordID
     * @param {string} password
     * @param {array} permissions
     */
    async addAdmin(name, citizenfxID, discordID, password, permissions){
        if(this.admins == false) throw new Error("Admins not set");

        //Check if username is already taken
        let existingUsername = this.getAdminByName(name);
        if(existingUsername) throw new Error("Username already taken");

        //Preparing admin
        let admin = {
            name: name,
            master: false,
            password_hash: GetPasswordHash(password),
            password_temporary: true,
            providers: {},
            permissions: permissions,
        }

        //Check if provider uid already taken and inserting into admin object
        if(citizenfxID.length){
            let existingCitizenFX = this.getAdminByProviderUID(citizenfxID)
            if(existingCitizenFX) throw new Error("CitizenFX ID already taken");
            admin.providers.citizenfx = {
                id: citizenfxID,
                data: {}
            }
        }
        if(discordID.length){
            let existingDiscord = this.getAdminByProviderUID(discordID)
            if(existingDiscord) throw new Error("Discord ID already taken");
            admin.providers.discord = {
                id: discordID,
                data: {}
            }
        }

        //Saving admin file
        this.admins.push(admin)
        try {
            await fs.writeFile(this.adminsFile, JSON.stringify(this.admins, null, 2), 'utf8');
            return true;
        } catch (error) {
            if(GlobalData.verbose) logError(error.message);
            throw new Error(`Failed to save '${this.adminsFile}'`);
        }
    }


    //================================================================
    /**
     * Edit admin and save to the admins file
     * @param {string} name
     * @param {string} password
     * @param {string} citizenfxID
     * @param {string} discordID
     * @param {array} permissions
     */
    async editAdmin(name, password, citizenfxID, discordID, permissions){
        if(this.admins == false) throw new Error("Admins not set");

        //Find admin index
        let username = name.toLowerCase();
        let adminIndex = this.admins.findIndex((user) => {
            return (username === user.name.toLowerCase())
        });
        if(adminIndex == -1) throw new Error("Admin not found");

        //Editing admin
        if(password !== null){
            this.admins[adminIndex].password_hash = GetPasswordHash(password);
            delete this.admins[adminIndex].password_temporary;
        }
        if(typeof citizenfxID !== 'undefined'){
            if(citizenfxID == ''){
                delete this.admins[adminIndex].providers.citizenfx;
            }else{
                this.admins[adminIndex].providers.citizenfx = {
                    id: citizenfxID,
                    data: {}
                }
            }
        }
        if(typeof discordID !== 'undefined'){
            if(discordID == ''){
                delete this.admins[adminIndex].providers.discord;
            }else{
                this.admins[adminIndex].providers.discord = {
                    id: discordID,
                    data: {}
                }
            }
        }
        if(typeof permissions !== 'undefined') this.admins[adminIndex].permissions = permissions;

        //Saving admin file
        try {
            await fs.writeFile(this.adminsFile, JSON.stringify(this.admins, null, 2), 'utf8');
            return (password !== null)? this.admins[adminIndex].password_hash : true;
        } catch (error) {
            if(GlobalData.verbose) logError(error.message);
            throw new Error(`Failed to save '${this.adminsFile}'`);
        }
    }


    //================================================================
    /**
     * Delete admin and save to the admins file
     * @param {string} name
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
            if(GlobalData.verbose) logError(error.message);
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
            logError(`Unable to load admins. (${x}, please read the documentation)`);
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

        let structureIntegrityTest = jsonData.some((x) => {
            if(typeof x.name !== 'string' || x.name < 3) return true;
            if(typeof x.master !== 'boolean') return true;
            if(typeof x.password_hash !== 'string' || !x.password_hash.startsWith('$2')) return true;
            if(typeof x.providers !== 'object') return true;
            let providersTest = Object.keys(x.providers).some((y) => {
                if(!Object.keys(this.providers).includes(y)) return true;
                if(typeof x.providers[y].id !== 'string' || x.providers[y].id.length < 3) return true;
                if(typeof x.providers[y].data !== 'object') return true;
            });
            if(providersTest) return true;
            if(!Array.isArray(x.permissions)) return true;
            return false;
        });
        if(structureIntegrityTest){
            return callError('invalid data in the admins file');
        }

        let masterCount = jsonData.filter((x) => { return x.master }).length;
        if(masterCount !== 1){
            return callError('must have exactly 1 master account');
        }

        if(!jsonData.length){
            return callError('no entries');
        }

        this.admins = jsonData;
        // if(GlobalData.verbose) log(`Admins file loaded. Found: ${this.admins.length}`);
        return true;
    }

} //Fim Authenticator()
