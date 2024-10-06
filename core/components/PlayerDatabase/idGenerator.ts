const modulename = 'IDGen';
import fsp from 'node:fs/promises';
import humanizeDuration, { HumanizerOptions } from 'humanize-duration';
import * as nanoidSecure from 'nanoid';
import * as nanoidNonSecure from 'nanoid/non-secure';
import consts from '@shared/consts';
import getOsDistro from '@core/extras/getOsDistro.js';
import { convars, txEnv } from '@core/globalData';
import { DatabaseObjectType } from './database';
import consoleFactory from '@extras/console';
const console = consoleFactory(modulename);

//Consts
type IdStorageTypes = DatabaseObjectType | Set<string>;
const maxAttempts = 10;
const noIdErrorMessage = 'Unnable to generate new Random ID possibly due to the decreased available entropy. Please send a screenshot of the detailed information in the terminal for the txAdmin devs.';


/**
 * Prints a diagnostics message to the console that should help us identify what is the problem and the potential solution
 */
const printDiagnostics = async () => {
    const humanizeOptions: HumanizerOptions = {
        round: true,
        units: ['d', 'h', 'm'],
    };
    let uptime;
    let entropy;
    try {
        uptime = humanizeDuration(process.uptime() * 1000, humanizeOptions);
        entropy = (await fsp.readFile('/proc/sys/kernel/random/entropy_avail', 'utf8')).trim();
    } catch (error) {
        entropy = (error as Error).message;
    }

    const secureStorage = new Set();
    for (let i = 0; i < 100; i++) {
        const randID = nanoidSecure.customAlphabet(consts.actionIdAlphabet, 4)();
        if (!secureStorage.has(randID)) secureStorage.add(randID);
    }

    const nonsecureStorage = new Set();
    for (let i = 0; i < 100; i++) {
        const randID = nanoidNonSecure.customAlphabet(consts.actionIdAlphabet, 4)();
        if (!nonsecureStorage.has(randID)) nonsecureStorage.add(randID);
    }

    const osDistro = await getOsDistro();
    console.error(noIdErrorMessage);
    console.error(`Uptime: ${uptime}`);
    console.error(`Entropy: ${entropy}`);
    console.error(`Distro: ${osDistro}`);
    console.error(`txAdmin: ${txEnv.txAdminVersion}`);
    console.error(`FXServer: ${txEnv.fxServerVersion}`);
    console.error(`ZAP: ${convars.isZapHosting}`);
    console.error(`Pterodactyl: ${convars.isPterodactyl}`);
    console.error(`Unique Test: secure ${secureStorage.size}/100, non-secure ${nonsecureStorage.size}/100`);
};

/**
 * Check in a storage weather the ID is unique or not.
 * @param {Set|Object} storage the Set or lowdb instance
 * @param {String} id
 * @param {String} lowdbTable
 * @returns {Boolean} if is unique
 */
const checkUniqueness = (storage: IdStorageTypes, id: string, lowdbTable: string) => {
    if (storage instanceof Set) {
        return !storage.has(id);
    } else {
        return !storage.chain.get(lowdbTable).find({ id }).value();
    }
};

/**
 * Generates an unique whitelist ID, or throws an error
 * @param {Set|Object} storage set or lowdb instance
 * @returns {String} id
 */
export const genWhitelistRequestID = (storage: IdStorageTypes) => {
    let attempts = 0;
    while (attempts < maxAttempts) {
        attempts++;
        const randFunc = (attempts <= 5) ? nanoidSecure : nanoidNonSecure;
        const id = 'R' + randFunc.customAlphabet(consts.actionIdAlphabet, 4)();
        if (checkUniqueness(storage, id, 'whitelistRequests')) {
            return id;
        }
    }

    printDiagnostics().catch((e) => {});
    throw new Error(noIdErrorMessage);
};

/**
 * Generates an unique action ID, or throws an error
 */
export const genActionID = (storage: IdStorageTypes, actionType: string) => {
    let attempts = 0;
    while (attempts < maxAttempts) {
        attempts++;
        const randFunc = (attempts <= 5) ? nanoidSecure : nanoidNonSecure;
        const id = actionType[0].toUpperCase()
            + randFunc.customAlphabet(consts.actionIdAlphabet, 3)()
            + '-'
            + randFunc.customAlphabet(consts.actionIdAlphabet, 4)();
        if (checkUniqueness(storage, id, 'actions')) {
            return id;
        }
    }

    printDiagnostics().catch((e) => {});
    throw new Error(noIdErrorMessage);
};
