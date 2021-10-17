//Requires
const modulename = 'PlayerController';
const { customAlphabet } = require('nanoid');
const humanizeDuration = require('humanize-duration'); //FIXME: remove, this controller is not the right place for interface stuff
const xss = require('../../extras/xss')(); //FIXME: same as above
const { dir, log, logOk, logWarn, logError } = require('../../extras/console')(modulename);
// eslint-disable-next-line no-unused-vars
const { SAVE_PRIORITY_LOW, SAVE_PRIORITY_MEDIUM, SAVE_PRIORITY_HIGH, Database } = require('./database.js');

//Helpers
const now = () => { return Math.round(Date.now() / 1000); };

//Consts
const validActions = ['ban', 'warn', 'whitelist'];



/*
    TODO:
    Move the following to another file:
    - getRegisteredActions
    - registerAction
    - revokeAction
    - approveWhitelist
    - checkPlayerJoin
*/

/**
 * Provide a central database for players, as well as assist with access control.
 *
 * FIXME: separate the player calls to another file somehow
 *
 * Database Structurure:
 *  - `players` table: index by license ID
 *      - license
 *      - name (overwrite on every update)
 *      - tsLastConnection  - Timestamp of the last connection
 *      - playTime - Online time counter in minutes
 *      - notes {
 *          text: string de tamanho máximo a ser definido,
 *          lastAdmin: username,
 *          tsLastEdit: timestamp,
 *      }
 *  - `actions`
 *      - id [X???-????]
 *      - identifiers [array]
 *      - playerName (player name, or false to imply it was performed on the identifiers only)
 *      - type [ban|warn|whitelist]
 *      - author (the admin name)
 *      - reason
 *      - timestamp
 *      - revocation: {
 *          timestamp: null,
 *          author: null,
 *      }
 *  - `pendingWL`
 *      - id [R####]
 *      - license
 *      - name
 *      - tsLastAttempt
 */
module.exports = class PlayerController {
    constructor(config) {
        this.config = config;
        this.activePlayers = [];
        this.db = new Database(config.wipePendingWLOnStart);

        //Config check
        if (this.config.minSessionTime < 1 || this.config.minSessionTime > 60) throw new Error('The playerController.minSessionTime setting must be between 1 and 60 minutes.');

        //Running playerlist generator
        if (process.env.APP_ENV !== 'webpack' && GlobalData.debugPlayerlistGenerator) {
            const PlayerlistGenerator = require('./playerlistGenerator.js');
            this.playerlistGenerator = new PlayerlistGenerator();
        }

        //Cron functions
        setInterval(() => {
            //Check if the database is ready
            if (this.db.obj === null) {
                if (GlobalData.verbose) logWarn('Database still not ready for processing.');
                return;
            }
            this.processActive();
        }, 15 * 1000);
    }


    /**
     * Refresh PlayerController configurations
     */
    refreshConfig() {
        this.config = globals.configVault.getScoped('playerController');
        const cmd = 'txAdmin-checkPlayerJoin ' + (this.config.onJoinCheckBan || this.config.onJoinCheckWhitelist).toString();
        try {
            globals.fxRunner.srvCmd(cmd);
        } catch (error) {
            if (GlobalData.verbose) dir(error);
        }
    }


    /**
     * Returns the entire lowdb object. Please be careful with it :)
     *
     * TODO: perhaps add a .cloneDeep()? Mighe cause some performance issues tho
     *
     * @returns {object} lodash database
     */
    getDB() {
        return this.db.obj;
    }


    /**
     * Processes the active players for playtime/sessiontime and sets to the database
     *
     * TODO: If this function is called multiple times within the first 15 seconds of an sessionTime minute,
     *          it will keep adding playTime
     *       Solution: keep an property for tsLastTimeIncremment, and wait for it to be >=60 before playtime++ and reset the ts
     * NOTE: I'm only saving notes every  15 seconds or when the player disconnects.
     */
    async processActive() {
        const checkMinuteElapsed = (time) => {
            return time > 15 && time % 60 < 15;
        };

        try {
            this.activePlayers.forEach(async (p) => {
                const sessionTime = now() - p.tsConnected;

                //If its time to add this player to the database
                if (p.isTmp && sessionTime >= this.config.minSessionTime) {
                    if (p.license == '3333333333333333333333deadbeef0000nosave') return; //DEBUG

                    this.db.writeFlag(SAVE_PRIORITY_LOW);
                    p.isTmp = false;
                    p.playTime = Math.round(sessionTime / 60);
                    p.notes = {
                        text: '',
                        lastAdmin: null,
                        tsLastEdit: null,
                    };
                    const toDB = {
                        license: p.license,
                        name: p.name,
                        playTime: p.playTime,
                        tsJoined: p.tsJoined,
                        tsLastConnection: p.tsConnected,
                        notes: p.notes,
                    };
                    await this.db.obj.get('players')
                        .push(toDB)
                        .value();
                    if (GlobalData.verbose) logOk(`Adding '${p.name}' to players database.`);

                //If it's time to update this player's play time
                } else if (!p.isTmp && checkMinuteElapsed(sessionTime)) {
                    this.db.writeFlag(SAVE_PRIORITY_LOW);
                    p.playTime += 1;
                    await this.db.obj.get('players')
                        .find({license: p.license})
                        .assign({
                            name: p.name,
                            playTime: p.playTime,
                            notes: p.notes,
                            tsLastConnection: p.tsConnected,
                        })
                        .value();
                    // logOk(`Updating '${p.name}' in players database.`); //DEBUG
                }
            });
        } catch (error) {
            logError(`Failed to process active players array with error: ${error.message}`);
            if (GlobalData.verbose) dir(error);
        }
    }


    /**
     * Searches for a player in the database by the license or id
     * @param {string} reference
     * @returns {object|null|false} object if player is found, null if not found, false if error occurs
     */
    async getPlayer(reference) {
        //Infering filter type
        let filter;
        if (/[0-9A-Fa-f]{40}/.test(reference)) {
            filter = {license: reference};
        } else if (/\d{1,6}/.test(reference)) {
            filter = {id: parseInt(reference, 10)};
        } else {
            throw new Error('Invalid reference type');
        }

        //Performing search
        try {
            const p = await this.db.obj.get('players').find(filter).cloneDeep().value();
            return (typeof p === 'undefined') ? null : p;
        } catch (error) {
            if (GlobalData.verbose) logError(`Failed to search for a player in the database with error: ${error.message}`);
            return false;
        }
    }


    /**
     * Searches for a registered action in the database by a list of identifiers and optional filters
     * Usage example: getRegisteredActions(['license:xxx'], {type: 'ban', revocation.timestamp: null})
     *
     * NOTE: I haven't actually benchmarked to make sure passing the filter first increases the performance
     *
     * @param {array} idArray identifiers array
     * @param {object} filter lodash-compatible filter object
     * @returns {array|error} array of actions, or, throws on error
     */
    async getRegisteredActions(idArray, filter = {}) {
        if (!Array.isArray(idArray)) throw new Error('Identifiers should be an array');
        try {
            return await this.db.obj.get('actions')
                .filter(filter)
                .filter((a) => idArray.some((fi) => a.identifiers.includes(fi)))
                .cloneDeep()
                .value();
        } catch (error) {
            const msg = `Failed to search for a registered action database with error: ${error.message}`;
            if (GlobalData.verbose) logError(msg);
            throw new Error(msg);
        }
    }


    /**
     * Processes an playerConnecting validation request
     *
     * TODO: improve ban message to be more verbose
     *
     * FIXME: this probably shouldn't be inside playerController
     *
     * @param {array} idArray identifiers array
     * @param {string} name player name
     * @returns {object} {allow: bool, reason: string}, or throws on error
     */
    async checkPlayerJoin(idArray, playerName) {
        //Check if required
        if (!this.config.onJoinCheckBan && !this.config.onJoinCheckWhitelist) {
            return {allow: true, reason: 'checks disabled'};
        }

        //DEBUG: save join log
        const toLog = {
            ts: Date.now(),
            playerName,
            idArray,
        };
        globals.databus.joinCheckHistory.push(toLog);
        if (globals.databus.joinCheckHistory.length > 25) globals.databus.joinCheckHistory.shift();

        //Sanity checks
        if (typeof playerName !== 'string') throw new Error('playerName should be an string.');
        if (!Array.isArray(idArray)) throw new Error('Identifiers should be an array.');
        idArray = idArray.filter((id) => {
            return Object.values(GlobalData.validIdentifiers).some((vf) => vf.test(id));
        });
        if (idArray.length < 1) throw new Error('Identifiers array must contain at least 1 valid identifier.');

        try {
            //Prepare & query
            const ts = now();
            const filter = (x) => {
                return (
                    (x.type == 'ban' || x.type == 'whitelist')
                    && (!x.expiration || x.expiration > ts)
                    && (!x.revocation.timestamp)
                );
            };
            const hist = await this.getRegisteredActions(idArray, filter);

            //Check ban
            if (this.config.onJoinCheckBan) {
                const ban = hist.find((a) => a.type == 'ban');
                if (ban) {
                    let msg;
                    const tOptions = {
                        id: ban.id,
                        reason: xss(ban.reason),
                        author: xss(ban.author),
                    };
                    if (ban.expiration) {
                        const humanizeOptions = {
                            language: globals.translator.t('$meta.humanizer_language'),
                            round: true,
                            units: ['d', 'h'],
                        };
                        tOptions.expiration = humanizeDuration((ban.expiration - ts) * 1000, humanizeOptions);
                        msg = globals.translator.t('ban_messages.reject_temporary', tOptions);
                    } else {
                        msg = globals.translator.t('ban_messages.reject_permanent', tOptions);
                    }

                    return {allow: false, reason: msg};
                }
            }

            //Check whitelist
            if (this.config.onJoinCheckWhitelist) {
                const wl = hist.find((a) => a.type == 'whitelist');
                if (!wl) {
                    //Get license
                    let license = idArray.find((id) => id.substring(0, 8) == 'license:');
                    if (!license) return {allow: false, reason: 'the whitelist module requires a license identifier.'};
                    license = license.substring(8);
                    //Check for pending WL requests
                    const pending = await this.db.obj.get('pendingWL').find({license: license}).value();
                    let whitelistID;
                    if (pending) {
                        pending.name = playerName;
                        pending.tsLastAttempt = now();
                        whitelistID = pending.id;
                    } else {
                        whitelistID = 'R' + customAlphabet(GlobalData.noLookAlikesAlphabet, 4)();
                        const toDB = {
                            id: whitelistID,
                            name: playerName,
                            license: license,
                            tsLastAttempt: now(),
                        };
                        await this.db.obj.get('pendingWL').push(toDB).value();
                    }
                    this.db.writeFlag(SAVE_PRIORITY_LOW);

                    //Clean rejection message
                    const xssRejectMessage = require('../../extras/xss')({
                        strong: [],
                        id: [],
                    });
                    const reason = xssRejectMessage(this.config.whitelistRejectionMessage)
                        .replace(/<\/?strong>/g, '')
                        .replace(/<id>/g, whitelistID);
                    return {allow: false, reason};
                }
            }

            return {allow: true, reason: null};
        } catch (error) {
            const msg = `Failed to check whitelist/blacklist: ${error.message}`;
            logError(msg);
            if (GlobalData.verbose) dir(error);
            return {allow: false, reason: msg};
        }
    }


    /**
     * Registers an action (ban, warn, whitelist)
     * @param {array|number} reference identifiers array or server id
     * @param {string} type [ban|warn|whitelist]
     * @param {string} author admin name
     * @param {string} reason reason
     * @param {number|false} expiration reason
     * @param {string|false} playerName the name of the player (for UX purposes only)
     * @returns {string} action ID, or throws if on error or ID not found
     */
    async registerAction(reference, type, author, reason = null, expiration = false, playerName = false) {
        //Sanity check
        const timestamp = now();
        if (!validActions.includes(type)) throw new Error('Invalid action type.');
        if (typeof author !== 'string' || !author.length) throw new Error('Invalid author.');
        if (reason !== null && (typeof reason !== 'string' || !reason.length)) throw new Error('Invalid reason.');
        if (expiration !== false && (typeof expiration !== 'number')) throw new Error('Invalid expiration.');
        if (playerName !== false && (typeof playerName !== 'string' || !playerName.length)) throw new Error('Invalid playerName.');

        //Processes target reference
        let identifiers;
        if (Array.isArray(reference)) {
            if (!reference.length) throw new Error('You must send at least one identifier');
            const invalids = reference.filter((id) => {
                return (typeof id !== 'string') || !Object.values(GlobalData.validIdentifiers).some((vf) => vf.test(id));
            });
            if (invalids.length) {
                throw new Error('Invalid identifiers: ' + invalids.join(', '));
            } else {
                identifiers = reference;
            }
        } else if (typeof reference == 'number') {
            const player = this.activePlayers.find((p) => p.id === reference);
            if (!player) throw new Error('Player disconnected.');
            if (!player.identifiers.length) throw new Error('Player has no identifiers.'); //sanity check
            identifiers = player.identifiers;
            playerName = player.name;
        } else {
            throw new Error(`Reference expected to be an array of strings or ID int. Received '${typeof target}'.`);
        }

        //Saves it to the database
        const actionPrefix = (type == 'warn') ? 'a' : type[0];
        const actionID = actionPrefix.toUpperCase()
            + customAlphabet(GlobalData.noLookAlikesAlphabet, 3)()
            + '-'
            + customAlphabet(GlobalData.noLookAlikesAlphabet, 4)();
        const toDB = {
            id: actionID,
            type,
            author,
            reason,
            expiration,
            timestamp,
            playerName,
            identifiers,
            revocation: {
                timestamp: null,
                author: null,
            },
        };
        try {
            await this.db.obj.get('actions')
                .push(toDB)
                .value();
            this.db.writeFlag(SAVE_PRIORITY_HIGH);
        } catch (error) {
            let msg = `Failed to register event to database with message: ${error.message}`;
            logError(msg);
            if (GlobalData.verbose) dir(error);
            throw new Error(msg);
        }


        return actionID;
    }


    /**
     * Revoke an action (ban, warn, whitelist)
     * @param {string} action_id action id
     * @param {string} author admin name
     * @param {array} allowedTypes array containing the types of actions this admin can revoke
     * @returns {string} null, error message string, or throws if something goes wrong
     */
    async revokeAction(action_id, author, allowedTypes = true) {
        if (typeof action_id !== 'string' || !action_id.length) throw new Error('Invalid action_id.');
        if (typeof author !== 'string' || !author.length) throw new Error('Invalid author.');
        if (allowedTypes !== true && !Array.isArray(allowedTypes)) throw new Error('Invalid allowedTypes.');
        try {
            const action = await this.db.obj.get('actions')
                .find({id: action_id})
                .value();
            if (action) {
                if (allowedTypes !== true && !allowedTypes.includes(action.type)) {
                    return 'you do not have permission to revoke this action';
                }
                action.revocation = {
                    timestamp: now(),
                    author,
                };
                this.db.writeFlag(SAVE_PRIORITY_HIGH);
                return null;
            } else {
                return 'action not found';
            }
        } catch (error) {
            const msg = `Failed to revoke action with message: ${error.message}`;
            logError(msg);
            if (GlobalData.verbose) dir(error);
            throw new Error(msg);
        }
    }


    /**
     * Whitelists a player from it's license or wl pending id
     *
     * NOTE: I'm only getting the first matched pending, but removing all matching
     * NOTE: maybe I should add a trycatch inside here
     *
     * @param {string} reference "license:" prefixed license or pending id
     * @param {string} author admin name
     * @returns {string} action ID, or throws if ID not found or error
     */
    async approveWhitelist(reference, author) {
        //Sanity check & validation
        if (typeof reference !== 'string' || typeof author !== 'string') {
            throw new Error('Reference and Author should be strings');
        }

        //Localizing pending request
        let pendingFilter;
        let saveReference;
        let playerName = false;
        if (/[0-9A-Fa-f]{40}/.test(reference)) {
            pendingFilter = {license: reference};
            saveReference = [`license:${reference}`];
            const pending = await this.db.obj.get('pendingWL').find(pendingFilter).value();
            if (pending) playerName = pending.name;
        } else if (GlobalData.regexWhitelistReqID.test(reference)) {
            pendingFilter = {id: reference};
            const pending = await this.db.obj.get('pendingWL').find(pendingFilter).value();
            if (!pending) throw new Error('Pending ID not found in database');
            saveReference = [`license:${pending.license}`];
            playerName = pending.name;
        } else {
            throw new Error('Invalid reference type');
        }

        //Register whitelist
        const actionID = await this.registerAction(saveReference, 'whitelist', author, null, false, playerName);
        if (!actionID) throw new Error('Failed to whitelist player');
        this.db.writeFlag(SAVE_PRIORITY_HIGH);

        //Remove from the pending list
        if (playerName) {
            await this.db.obj.get('pendingWL').remove(pendingFilter).value();
        }

        return actionID;
    }


    /**
     * Saves a player notes and returns true/false
     * Usage example: setPlayerNote('xxx', 'super awesome player', 'tabarra')
     *
     * NOTE: Setting writePending here won't do anything. Don't try it...
     *
     * @param {string} license
     * @param {string} note
     * @param {string} author
     * @returns {boolean}
     */
    async setPlayerNote(license, note, author) {
        try {
            //Search player
            let target;
            let ap = this.activePlayers.find((p) => p.license === license);
            if (ap) {
                target = ap;
            } else {
                let dbp = await this.db.obj.get('players').find({license: license}).value();
                if (!dbp) return false;
                target = dbp;
            }

            //Add note and set pending flag
            target.notes = {
                text: note,
                lastAdmin: author,
                tsLastEdit: now(),
            };

            return true;
        } catch (error) {
            if (GlobalData.verbose) logError(`Failed to search for a registered action database with error: ${error.message}`);
            return false;
        }
    }


    /**
     * Cleans the database by removing every entry that matches the provided filter function.
     *
     * @param {String} table identifiers array
     * @param {function} filter lodash-compatible filter function
     * @returns {number|error} number of removed items
     */
    async cleanDatabase(tableName, filterFunc) {
        if (tableName !== 'players' && tableName !== 'actions') throw new Error('Unknown tableName.');
        if (typeof filterFunc !== 'function') throw new Error('filterFunc must be a function.');

        try {
            const removed = await this.db.obj.get(tableName)
                .remove(filterFunc)
                .value();
            return removed.length;
        } catch (error) {
            const msg = `Failed to clean database with error: ${error.message}`;
            if (GlobalData.verbose) logError(msg);
            throw new Error(msg);
        }
    }


    /**
     * Returns a mostly /players.json compatible playerlist based on the activePlayers
     *
     * NOTE: ATM only used by the /status endpoint.
     *       Let's try to use just clone(globals.playerController.activePlayers)
     *
     * @returns {array} array of player objects
     */
    getPlayerList() {
        try {
            return this.activePlayers.map((p) => {
                return {
                    license: p.license,
                    id: p.id,
                    name: p.name,
                    ping: p.ping,
                    identifiers: p.identifiers,
                };
            });
        } catch (error) {
            if (GlobalData.verbose) logError(`Failed to generate playerlist with error: ${error.message}`);
            return false;
        }
    }


    /**
     * Processes the monitor heartbeat to update internal active playerlist.
     * Macro view of this function:
     *  -For all removed players = remove from this.activePlayers
     *  -For all new players:
     *      - search for them in the db
     *      - add them to the active players containing:
     *          - some prop to indicate if it's present in the database
     *          - tsConnected
     *
     * NOTE:  This code was written this way to improve performance in exchange of readability
     *           the ES6 gods might not like this..
     * TODO: To prevent retaliation from the gods, consider making the activePlayers a Map instead of an Array.
     *
     * FIXME: I'm guaranteeing there are not two players with the same License, but not ID.
     *
     * NOTE: currently being called every 3 seconds
     *
     * @param {array} players
     */
    async processHeartBeat(players) {
        //DEBUG: in case the player generator is enabled
        if (this.playerlistGenerator) players = this.playerlistGenerator.playerlist;

        try {
            //Sanity check
            if (!Array.isArray(players)) throw new Error('expected array');

            //Validate & filter players then extract ids and license
            const hbPlayers = new Map();
            let invalids = 0;
            let duplicated = 0;
            for (let i = 0; i < players.length; i++) {
                const p = Object.assign({}, players[i]);

                //Basic struct
                if (
                    typeof p !== 'object'
                    || typeof p.name !== 'string'
                    || typeof p.id !== 'number'
                    || typeof p.license !== 'undefined'
                    || !Array.isArray(p.identifiers)
                    || !p.identifiers.length
                ) {
                    invalids++;
                    continue;
                }

                //Extract license
                for (let j = 0; j < p.identifiers.length; j++) {
                    if (p.identifiers[j].length == 48 && p.identifiers[j].substring(0, 8) == 'license:') {
                        p.license = p.identifiers[j].substring(8);
                        break;
                    }
                }

                //Check if license id exist and is not duplicated
                if (typeof p.license !== 'string') {
                    invalids++;
                    continue;
                }
                if (hbPlayers.has(p.license)) {
                    duplicated++;
                    continue;
                }

                //Add to licenses list
                delete p.endpoint;
                hbPlayers.set(p.license, p);
            }
            if (GlobalData.verbose && invalids) logWarn(`HeartBeat playerlist contained ${invalids} invalid players that were removed.`);
            if (GlobalData.verbose && duplicated) logWarn(`HeartBeat playerlist contained ${duplicated} duplicated players that were removed.`);


            //Processing active players list, creating the removed list, creating new active list without removed players
            const disconnectedPlayers = [];
            const activePlayerLicenses = []; //Optimization only
            const newActivePlayers = [];
            for (let i = 0; i < this.activePlayers.length; i++) {
                const hbPlayerData = hbPlayers.get(this.activePlayers[i].license);
                if (hbPlayerData) {
                    const updatedPlayer = Object.assign(
                        this.activePlayers[i],
                        {
                            id: hbPlayerData.id, //NOTE: possibly the solution to the double player issue?
                            ping: hbPlayerData.ping,
                            // extraData: hbPlayerData.extraData //NOTE: reserve for RolePlay data from frameworks
                        },
                    );
                    newActivePlayers.push(updatedPlayer);
                    activePlayerLicenses.push(this.activePlayers[i].license);
                } else {
                    disconnectedPlayers.push(this.activePlayers[i]);
                }
            }

            //Processing the new players
            for (const [license, player] of hbPlayers) {
                //Make sure we are not adding the same user twice
                if (!activePlayerLicenses.includes(player.license)) {
                    //Filter to only valid identifiers
                    player.identifiers = player.identifiers.filter((id) => {
                        return Object.values(GlobalData.validIdentifiers).some((vf) => vf.test(id));
                    });
                    //Check if he is already on the database
                    const dbPlayer = await this.getPlayer(license);
                    if (dbPlayer) {
                        //TODO: create a AllAssocIds for the players, containing all intersecting identifiers
                        const newPlayer = Object.assign({}, player, {
                            tsJoined: dbPlayer.tsJoined,
                            playTime: dbPlayer.playTime,
                            tsConnected: now(),
                            isTmp: false,
                            notes: dbPlayer.notes,
                        });
                        newActivePlayers.push(newPlayer);
                    } else {
                        const tsNow = now(); //FIXME: pra fora do loop?
                        player.tsJoined = tsNow;
                        player.tsConnected = tsNow;
                        player.isTmp = true;
                        newActivePlayers.push(player);
                    }
                }
            }

            //Committing disconnected players data
            //NOTE: I'm only assigning the notes because that's currently the only thing that can change between saves.
            if (disconnectedPlayers.length) this.db.writeFlag(SAVE_PRIORITY_LOW);
            disconnectedPlayers.forEach(async (p) => {
                try {
                    //p.sessions.push({ts: now(), time: p.playTime})
                    // some code here to save the p.playTime
                    await this.db.obj.get('players')
                        .find({license: p.license})
                        .assign({
                            notes: p.notes,
                        })
                        .value();
                } catch (error) {
                    logError(`Failed to save the the following disconnected player to the database with error: ${error.message}`);
                    dir(p);
                }
            });

            //Replacing the active playerlist
            this.activePlayers = newActivePlayers;
        } catch (error) {
            if (GlobalData.verbose) {
                logError(`PlayerController failed to process HeartBeat with error: ${error.message}`);
                dir(error);
            }
        }
    }//Fim processHeartBeat()
}; //Fim PlayerController()
