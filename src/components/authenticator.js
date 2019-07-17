//Requires
const fs = require('fs');
const bcrypt = require('bcrypt');
const clone = require('clone');
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../extras/console');
const context = 'Authenticator';


module.exports = class Authenticator {
    constructor(config) {
        logOk('::Started', context);
        this.config = config;
        this.admins = null;
        this.registeredPermissions = [
            "all",
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
        ];
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
        let username = uname.trim().toLowerCase();
        let admin = this.admins.find((user) => {
            return (username === user.name.toLowerCase() && bcrypt.compareSync(pwd, user.password_hash))
        });
        return (admin)? admin : false;
    }


    //================================================================
    /**
     * Returns a list of admins and permissions
     */
    getAdmins(){
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
    addAdmin(name, password, permissions){
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
            fs.writeFileSync('data/admins.json', JSON.stringify(this.admins, null, 2), 'utf8');
            return true;
        } catch (error) {
            if(globals.config.verbose) log(error, context);
            throw new Error("Failed to save 'data/admins.json' file.");
        }
    }


    //================================================================
    /**
     * Edit admin and save to the admins file
     * @param {*} name
     * @param {*} password
     * @param {*} permissions
     */
    editAdmin(name, password, permissions){
        //Find admin index
        let username = name.toLowerCase();
        let adminIndex = this.admins.findIndex((user) => {
            return (username === user.name.toLowerCase())
        });
        if(adminIndex == -1) throw new Error("Admin not found");

        //Editing admin
        if(password) this.admins[adminIndex].password_hash = bcrypt.hashSync(password, 5);
        this.admins[adminIndex].permissions = permissions

        //Saving admin file
        try {
            fs.writeFileSync('data/admins.json', JSON.stringify(this.admins, null, 2), 'utf8');
            return true;
        } catch (error) {
            if(globals.config.verbose) log(error, context);
            throw new Error("Failed to save 'data/admins.json' file.");
        }
    }


    //================================================================
    /**
     * Delete admin and save to the admins file
     * @param {*} name
     */
    deleteAdmin(name){
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
            fs.writeFileSync('data/admins.json', JSON.stringify(this.admins, null, 2), 'utf8');
            return true;
        } catch (error) {
            if(globals.config.verbose) log(error, context);
            throw new Error("Failed to save 'data/admins.json' file.");
        }
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
            raw = fs.readFileSync('data/admins.json', 'utf8');
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
