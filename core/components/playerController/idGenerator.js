//Requires
const modulename = 'IDGen';
const fs = require('fs').promises;
const humanizeDuration = require('humanize-duration');
const nanoidSecure = require('nanoid');
const nanoidNonSecure = require('nanoid/non-secure');
const { dir, log, logOk, logWarn, logError } = require('../../extras/console')(modulename);

//Consts
const maxAttempts = 10;
const noIdErrorMessage = 'Unnable to generate new Random ID possibly due to the decreased available entropy. Please send a screenshot of the detailed information in the terminal for the txAdmin devs.';


/**
 * Prints a diagnostics message to the console that should help us identify what is the problem and the potential solution
 */
const printDiagnostics = async () => {
    const humanizeOptions = {
        round: true,
        units: ['d', 'h', 'm'],
    };
    let uptime;
    let entropy;
    try {
        uptime = humanizeDuration(process.uptime() * 1000, humanizeOptions);
        entropy = (await fs.readFile('/proc/sys/kernel/random/entropy_avail', 'utf8')).trim();
    } catch (error) {
        entropy = error.message;
    }

    const secureStorage = new Set();
    for (let i = 0; i < 100; i++) {
        const randID = nanoidSecure.customAlphabet(GlobalData.noLookAlikesAlphabet, 4)();
        if (!secureStorage.has(randID)) secureStorage.add(randID);
    }

    const nonsecureStorage = new Set();
    for (let i = 0; i < 100; i++) {
        const randID = nanoidNonSecure.customAlphabet(GlobalData.noLookAlikesAlphabet, 4)();
        if (!nonsecureStorage.has(randID)) nonsecureStorage.add(randID);
    }

    logError(noIdErrorMessage);
    logError(`Uptime: ${uptime}`);
    logError(`Entropy: ${entropy}`);
    logError(`Distro: ${GlobalData.osDistro}`);
    logError(`OS Type: ${GlobalData.osType}`);
    logError(`txAdmin: ${GlobalData.txAdminVersion}`);
    logError(`FXServer: ${GlobalData.fxServerVersion}`);
    logError(`ZAP: ${GlobalData.isZapHosting}`);
    logError(`Unique Test: secure ${secureStorage.size}/100, non-secure ${nonsecureStorage.size}/100`);
};

/**
 * Check in a storage weather the ID is unique or not.
 * @param {Set|Object} storage the Set or lowdb instance
 * @param {String} id
 * @param {String} lowdbTable
 * @returns {Boolean} if is unique
 */
const checkUniqueness = async (storage, id, lowdbTable) => {
    if (storage instanceof Set) {
        return !storage.has(id);
    } else {
        return !storage.get(lowdbTable).find({ id }).value();
    }
};

/**
 * Generates an unique whitelist ID, or throws an error
 * @param {Set|Object} storage set or lowdb instance
 * @returns {String} id
 */
module.exports.genWhitelistID = async (storage) => {
    let attempts = 0;
    while (attempts < maxAttempts) {
        attempts++;
        if (attempts > 5) globals.databus.txStatsData.randIDFailures++;
        const randFunc = (attempts <= 5) ? nanoidSecure : nanoidNonSecure;
        const id = 'R' + randFunc.customAlphabet(GlobalData.noLookAlikesAlphabet, 4)();
        if (await checkUniqueness(storage, id, 'pendingWL')) {
            return id;
        }
    }

    await printDiagnostics();
    throw new Error(noIdErrorMessage);
};

/**
 * Generates an unique action ID, or throws an error
 * @param {Set|Object} storage set or lowdb instance
 * @param {String} actionType [warn, ban, whitelist]
 * @returns {String} id
 */
module.exports.genActionID = async (storage, actionType) => {
    const actionPrefix = ((actionType == 'warn') ? 'a' : actionType[0]).toUpperCase();
    let attempts = 0;
    while (attempts < maxAttempts) {
        attempts++;
        if (attempts > 5) globals.databus.txStatsData.randIDFailures++;
        const randFunc = (attempts <= 5) ? nanoidSecure : nanoidNonSecure;
        const id = actionPrefix
            + randFunc.customAlphabet(GlobalData.noLookAlikesAlphabet, 3)()
            + '-'
            + randFunc.customAlphabet(GlobalData.noLookAlikesAlphabet, 4)();
        if (await checkUniqueness(storage, id, 'actions')) {
            return id;
        }
    }

    await printDiagnostics();
    throw new Error(noIdErrorMessage);
};
