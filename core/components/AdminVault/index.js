const modulename = 'AdminVault';
import fse from 'fs-extra';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import { cloneDeep } from 'lodash-es';
import { nanoid } from 'nanoid';
import { convars, txEnv } from '@core/globalData';
import CitizenFXProvider from './providers/CitizenFX.js';
import { createHash } from 'node:crypto';
import consoleFactory from '@extras/console';
import chalk from 'chalk';
const console = consoleFactory(modulename);


//Helpers
const migrateProviderIdentifiers = (providerName, providerData) => {
    if (providerName === 'citizenfx') {
        // data may be empty, or nameid may be invalid
        try {
            const res = /\/user\/(\d{1,8})/.exec(providerData.data.nameid);
            providerData.identifier = `fivem:${res[1]}`;
        } catch (error) {
            providerData.identifier = 'fivem:00000000';
        }
    } else if (providerName === 'discord') {
        providerData.identifier = `discord:${providerData.id}`;
    }
};


export default class AdminVault {
    constructor() {
        this.adminsFile = `${txEnv.dataPath}/admins.json`;
        this.adminsFileHash = null;
        this.admins = null;
        this.refreshRoutine = null;

        //Not alphabetical order, but that's fine
        this.registeredPermissions = {
            'all_permissions': 'All Permissions',
            'manage.admins': 'Manage Admins', //will enable the "set admin" button in the player modal
            'settings.view': 'Settings: View (no tokens)',
            'settings.write': 'Settings: Change',
            'console.view': 'Console: View',
            'console.write': 'Console: Write',
            'control.server': 'Start/Stop Server + Scheduler', //FIXME: horrible name
            'announcement': 'Send Announcements',
            'commands.resources': 'Start/Stop Resources',
            'server.cfg.editor': 'Read/Write server.cfg', //FIXME: rename to server.cfg_editor
            'txadmin.log.view': 'View System Logs', //FIXME: rename to system.log.view

            'menu.vehicle': 'Spawn / Fix Vehicles',
            'menu.clear_area': 'Reset world area',
            'menu.viewids': 'View Player IDs in-game', //be able to see the ID of the players
            'players.direct_message': 'Direct Message',
            'players.whitelist': 'Whitelist',
            'players.warn': 'Warn',
            'players.kick': 'Kick',
            'players.ban': 'Ban',
            'players.freeze': 'Freeze Players',
            'players.heal': 'Heal', //self, everyone, and the "heal" button in player modal
            'players.playermode': 'NoClip / God Mode', //self playermode, and also the player spectate option
            'players.spectate': 'Spectate', //self playermode, and also the player spectate option
            'players.teleport': 'Teleport', //self teleport, and the bring/go to on player modal
            'players.troll': 'Troll Actions', //all the troll options in the player modal
        };
        this.hardConfigs = {
            refreshInterval: 15e3,
        };


        //Load providers
        try {
            this.providers = {
                discord: false,
                citizenfx: new CitizenFXProvider(),
            };
        } catch (error) {
            throw new Error(`Failed to load providers with error: ${error.message}`);
        }

        //Check if admins file exists
        let adminFileExists;
        try {
            fs.statSync(this.adminsFile, fs.constants.F_OK);
            adminFileExists = true;
        } catch (error) {
            if (error.code === 'ENOENT') {
                adminFileExists = false;
            } else {
                throw new Error(`Failed to check presence of admin file with error: ${error.message}`);
            }
        }

        //Printing PIN or starting loop
        if (!adminFileExists) {
            if (!convars.defaultMasterAccount) {
                this.addMasterPin = (Math.random() * 10000).toFixed().padStart(4, '0');
                this.admins = false;
            } else {
                console.log(`Setting up master account '${convars.defaultMasterAccount.name}'. The password is the same as in zap-hosting.com.`);
                this.createAdminsFile(convars.defaultMasterAccount.name, false, false, convars.defaultMasterAccount.password_hash, false);
            }
        } else {
            this.loadAdminsFile();
            this.setupRefreshRoutine();
        }
    }


    /**
     * sets the admins file refresh routine
     */
    setupRefreshRoutine() {
        this.refreshRoutine = setInterval(() => {
            this.checkAdminsFile();
        }, this.hardConfigs.refreshInterval);
    }


    /**
     * Creates a admins.json file based on the first account
     * @param {string} username
     * @param {string} identifier
     * @param {object} provider_data
     * @param {string} password backup password
     * @param {boolean} isPlainText
     * @param {string|undefined} discordId
     * @returns {(boolean)} true or throws an error
     */
    createAdminsFile(username, identifier, provider_data, password, isPlainText, discordId) {
        //Sanity check
        if (this.admins !== false && this.admins !== null) throw new Error('Admins file already exists.');
        if (typeof username !== 'string' || username.length < 3) throw new Error('Invalid username parameter.');
        if (typeof password !== 'string' || password.length < 6) throw new Error('Invalid password parameter.');

        //Creating admin array
        const providers = {};
        if (identifier && provider_data) {
            providers.citizenfx = {
                id: username,
                identifier,
                data: provider_data,
            };
        }
        if (discordId) {
            providers.discord = {
                id: discordId,
                identifier: `discord:${discordId}`,
                data: {},
            };
        }
        const newAdmin = {
            name: username,
            master: true,
            password_hash: (isPlainText) ? GetPasswordHash(password) : password,
            providers,
            permissions: [],
        };
        this.admins = [newAdmin];
        this.addMasterPin = undefined;

        //Saving admin file
        try {
            const jsonData = JSON.stringify(this.admins);
            this.adminsFileHash = createHash('sha1').update(jsonData).digest('hex');
            fse.writeFileSync(this.adminsFile, jsonData, { encoding: 'utf8', flag: 'wx' });
            this.setupRefreshRoutine();
            return newAdmin;
        } catch (error) {
            let message = `Failed to create '${this.adminsFile}' with error: ${error.message}`;
            console.verbose.error(message);
            throw new Error(message);
        }
    }


    /**
     * Returns a list of admins and permissions
     */
    getAdminsList() {
        if (this.admins == false) return [];
        return this.admins.map((user) => {
            return {
                name: user.name,
                master: user.master,
                providers: Object.keys(user.providers),
                permissions: user.permissions,
            };
        });
    }


    /**
     * Returns the raw array of admins, except for the hash
     */
    getRawAdminsList() {
        if (this.admins === false) return [];
        return cloneDeep(this.admins);
    }


    /**
     * Returns all data from an admin by provider user id (ex discord id), or false
     * @param {string} uid
     */
    getAdminByProviderUID(uid) {
        if (this.admins == false) return false;
        let id = uid.trim().toLowerCase();
        if (!id.length) return false;
        let admin = this.admins.find((user) => {
            return Object.keys(user.providers).find((provider) => {
                return (id === user.providers[provider].id.toLowerCase());
            });
        });
        return (admin) ? cloneDeep(admin) : false;
    }


    /**
     * Returns an array with all identifiers of the admins (fivem/discord)
     */
    getAdminsIdentifiers() {
        if (this.admins === false) return [];
        const ids = [];
        for (const admin of this.admins) {
            admin.providers.citizenfx && ids.push(admin.providers.citizenfx.identifier);
            admin.providers.discord && ids.push(admin.providers.discord.identifier);
        }
        return ids;
    }


    /**
     * Returns all data from an admin by their name, or false
     * @param {string} uname
     */
    getAdminByName(uname) {
        if (!this.admins) return false;
        const username = uname.trim().toLowerCase();
        if (!username.length) return false;
        const admin = this.admins.find((user) => {
            return (username === user.name.toLowerCase());
        });
        return (admin) ? cloneDeep(admin) : false;
    }


    /**
     * Returns all data from an admin by game identifier, or false
     * @param {string[]} identifiers
     */
    getAdminByIdentifiers(identifiers) {
        if (!this.admins) return false;
        identifiers = identifiers
            .map((i) => i.trim().toLowerCase())
            .filter((i) => i.length);
        if (!identifiers.length) return false;
        const admin = this.admins.find((user) =>
            identifiers.find((identifier) =>
                Object.keys(user.providers).find((provider) =>
                    (identifier === user.providers[provider].identifier.toLowerCase()))));
        return (admin) ? cloneDeep(admin) : false;
    }


    /**
     * Returns a list with all registered permissions
     */
    getPermissionsList() {
        return cloneDeep(this.registeredPermissions);
    }


    /**
     * Writes to storage the admins file
     */
    async writeAdminsFile() {
        const jsonData = JSON.stringify(this.admins, null, 2);
        this.adminsFileHash = createHash('sha1').update(jsonData).digest('hex');
        await fsp.writeFile(this.adminsFile, jsonData, 'utf8');
        return true;
    }


    /**
     * Writes to storage the admins file
     */
    async checkAdminsFile() {
        const restore = async () => {
            try {
                await this.writeAdminsFile();
                console.ok('Restored admins.json file.');
            } catch (error) {
                console.error(`Failed to restore admins.json file: ${error.message}`);
                console.verbose.dir(error);
            }
        };
        try {
            const jsonData = await fse.readFile(this.adminsFile, 'utf8');
            const inboundHash = createHash('sha1').update(jsonData).digest('hex');
            if (this.adminsFileHash !== inboundHash) {
                console.warn('The admins.json file was modified or deleted by an external source, txAdmin will try to restore it.');
                restore();
            }
        } catch (error) {
            console.error(`Cannot check admins file integrity: ${error.message}`);
        }
    }


    /**
     * Add a new admin to the admins file
     * NOTE: I'm fully aware this coud be optimized. Leaving this way to improve readability and error verbosity
     * @param {string} name
     * @param {object|undefined} citizenfxData or false
     * @param {object|undefined} discordData or false
     * @param {string} password
     * @param {array} permissions
     */
    async addAdmin(name, citizenfxData, discordData, password, permissions) {
        if (this.admins == false) throw new Error('Admins not set');

        //Check if username is already taken
        if (this.getAdminByName(name)) throw new Error('Username already taken');

        //Preparing admin
        const admin = {
            name: name,
            master: false,
            password_hash: GetPasswordHash(password),
            password_temporary: true,
            providers: {},
            permissions: permissions,
        };

        //Check if provider uid already taken and inserting into admin object
        if (citizenfxData) {
            const existingCitizenFX = this.getAdminByProviderUID(citizenfxData.id);
            if (existingCitizenFX) throw new Error('CitizenFX ID already taken');
            admin.providers.citizenfx = {
                id: citizenfxData.id,
                identifier: citizenfxData.identifier,
                data: {},
            };
        }
        if (discordData) {
            const existingDiscord = this.getAdminByProviderUID(discordData.id);
            if (existingDiscord) throw new Error('Discord ID already taken');
            admin.providers.discord = {
                id: discordData.id,
                identifier: discordData.identifier,
                data: {},
            };
        }

        //Saving admin file
        this.admins.push(admin);
        this.refreshOnlineAdmins().catch((e) => { });
        try {
            return await this.writeAdminsFile();
        } catch (error) {
            throw new Error(`Failed to save admins.json with error: ${error.message}`);
        }
    }


    /**
     * Edit admin and save to the admins file
     * @param {string} name
     * @param {string|null} password
     * @param {object|undefined} citizenfxData or false
     * @param {object|undefined} discordData or false
     * @param {array|undefined} permissions
     */
    async editAdmin(name, password, citizenfxData, discordData, permissions) {
        if (this.admins == false) throw new Error('Admins not set');

        //Find admin index
        let username = name.toLowerCase();
        let adminIndex = this.admins.findIndex((user) => {
            return (username === user.name.toLowerCase());
        });
        if (adminIndex == -1) throw new Error('Admin not found');

        //Editing admin
        if (password !== null) {
            this.admins[adminIndex].password_hash = GetPasswordHash(password);
            delete this.admins[adminIndex].password_temporary;
        }
        if (typeof citizenfxData !== 'undefined') {
            if (!citizenfxData) {
                delete this.admins[adminIndex].providers.citizenfx;
            } else {
                this.admins[adminIndex].providers.citizenfx = {
                    id: citizenfxData.id,
                    identifier: citizenfxData.identifier,
                    data: {},
                };
            }
        }
        if (typeof discordData !== 'undefined') {
            if (!discordData) {
                delete this.admins[adminIndex].providers.discord;
            } else {
                this.admins[adminIndex].providers.discord = {
                    id: discordData.id,
                    identifier: discordData.identifier,
                    data: {},
                };
            }
        }
        if (typeof permissions !== 'undefined') this.admins[adminIndex].permissions = permissions;

        //Prevent race condition, will allow the session to be updated before refreshing socket.io
        //sessions which will cause reauth and closing of the temp password modal on first access
        setTimeout(() => {
            this.refreshOnlineAdmins().catch((e) => { });
        }, 250);

        //Saving admin file
        try {
            await this.writeAdminsFile();
            return (password !== null) ? this.admins[adminIndex].password_hash : true;
        } catch (error) {
            throw new Error(`Failed to save admins.json with error: ${error.message}`);
        }
    }


    /**
     * Delete admin and save to the admins file
     * @param {string} name
     */
    async deleteAdmin(name) {
        if (this.admins == false) throw new Error('Admins not set');

        //Delete admin
        let username = name.toLowerCase();
        let found = false;
        this.admins = this.admins.filter((user) => {
            if (username !== user.name.toLowerCase()) {
                return true;
            } else {
                found = true;
                return false;
            }
        });
        if (!found) throw new Error('Admin not found');

        //Saving admin file
        this.refreshOnlineAdmins().catch((e) => { });
        try {
            return await this.writeAdminsFile();
        } catch (error) {
            throw new Error(`Failed to save admins.json with error: ${error.message}`);
        }
    }

    /**
     * Loads the admins.json file into the admins list
     * NOTE: The verbosity here is driving me insane.
     *       But still seems not to be enough for people that don't read the README.
     */
    async loadAdminsFile() {
        let raw = null;
        let jsonData = null;
        let hasMigration = false;

        const callError = (reason) => {
            console.error(`Unable to load admins.json: ${reason}`);
            if (reason === 'cannot read file') {
                console.error('This means the file  doesn\'t exist or txAdmin doesn\'t have permission to read it.');
            } else {
                console.error('This likely means the file got somehow corrupted.');
                console.error('You can try restoring it or you can delete it and let txAdmin create a new one.');
            }
            console.error(`Admin File Path: ${this.adminsFile}`);
            process.exit(5300);
        };

        try {
            raw = await fsp.readFile(this.adminsFile, 'utf8');
            this.adminsFileHash = createHash('sha1').update(raw).digest('hex');
        } catch (error) {
            return callError('cannot read file');
        }

        if (!raw.length) {
            return callError('empty file');
        }

        try {
            jsonData = JSON.parse(raw);
        } catch (error) {
            return callError('json parse error');
        }

        if (!Array.isArray(jsonData)) {
            return callError('not an array');
        }

        if (!jsonData.length) {
            return callError('no admins');
        }

        const structureIntegrityTest = jsonData.some((x) => {
            if (typeof x.name !== 'string' || x.name.length < 3) return true;
            if (typeof x.master !== 'boolean') return true;
            if (typeof x.password_hash !== 'string' || !x.password_hash.startsWith('$2')) return true;
            if (typeof x.providers !== 'object') return true;
            const providersTest = Object.keys(x.providers).some((y) => {
                if (!Object.keys(this.providers).includes(y)) return true;
                if (typeof x.providers[y].id !== 'string' || x.providers[y].id.length < 3) return true;
                if (typeof x.providers[y].data !== 'object') return true;
                if (typeof x.providers[y].identifier === 'string') {
                    if (x.providers[y].identifier.length < 3) return true;
                } else {
                    migrateProviderIdentifiers(y, x.providers[y]);
                    hasMigration = true;
                }
            });
            if (providersTest) return true;
            if (!Array.isArray(x.permissions)) return true;
            return false;
        });
        if (structureIntegrityTest) {
            return callError('invalid data in the admins file');
        }

        const masters = jsonData.filter((x) => x.master);
        if (masters.length !== 1) {
            return callError('must have exactly 1 master account');
        }

        //Migration (tx v7.3.0): separate DM and Announcement permissions
        jsonData.forEach((admin) => {
            if (admin.permissions.includes('players.message')) {
                hasMigration = true;
                admin.permissions = admin.permissions.filter((perm) => perm !== 'players.message');
                admin.permissions.push('players.direct_message');
                admin.permissions.push('announcement');
            }
        });

        this.admins = jsonData;
        //NOTE: since this runs only at the start, nobody is online yet
        // this.refreshOnlineAdmins().catch((e) => { });
        if (hasMigration) {
            try {
                await this.writeAdminsFile();
                console.ok('The admins.json file was migrated to a new version.');
            } catch (error) {
                console.error(`Failed to migrate admins.json with error: ${error.message}`);
            }
        }

        return true;
    }


    /**
     * Notify game server about admin changes
     */
    async refreshOnlineAdmins() {
        //Refresh auth of all admins connected to socket.io
        globals.webServer.webSocket.reCheckAdminAuths().catch((e) => { });

        //Refresh in-game auth of all admins connected to the server
        if (globals.playerlistManager === null) return;
        try {
            //Getting all admin identifiers
            const adminIDs = this.admins.reduce((ids, adm) => {
                const adminIDs = Object.keys(adm.providers).map((pName) => adm.providers[pName].identifier);
                return ids.concat(adminIDs);
            }, []);

            //Finding online admins
            const playerList = globals.playerlistManager.getPlayerList();
            const onlineIDs = playerList.filter((p) => {
                return p.ids.some((i) => adminIDs.includes(i));
            }).map((p) => p.netid);

            globals.fxRunner.sendEvent('adminsUpdated', onlineIDs);
        } catch (error) {
            console.verbose.error('Failed to refreshOnlineAdmins() with error:');
            console.verbose.dir(error);
        }
    }


    /**
     * Returns a random token to be used as CSRF Token.
     */
    genCsrfToken() {
        return nanoid();
    }


    /**
     * Checks if there are admins configured or not.
     * Optionally, prints the master PIN on the console.
     */
    hasAdmins(printPin = false) {
        if (Array.isArray(this.admins) && this.admins.length) {
            return true;
        } else {
            if (printPin) {
                console.warn('Use this PIN to add a new master account: ' + chalk.inverse(` ${this.addMasterPin} `));
            }
            return false;
        }
    }


    /**
     * Returns the public name to display for that particular purpose
     * TODO: maybe use enums for the purpose
     */
    getAdminPublicName(name, purpose) {
        if (!name || !purpose) throw new Error('Invalid parameters');
        const replacer = globals.txAdmin.globalConfig.serverName ?? 'txAdmin';

        if (purpose === 'punishment') {
            return globals.txAdmin.globalConfig.hideAdminInPunishments ? replacer : name;
        } else if (purpose === 'message') {
            return globals.txAdmin.globalConfig.hideAdminInMessages ? replacer : name;
        } else {
            throw new Error(`Invalid purpose: ${purpose}`);
        }
    }
};
