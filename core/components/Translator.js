const modulename = 'Translator';
import fs from 'node:fs';
import path from 'node:path';
import Polyglot from 'node-polyglot';
import logger from '@core/extras/console.js';
import { txEnv, verbose } from '@core/globalData';
import localeMap from '@shared/localeMap';
const { dir, log, logOk, logWarn, logError } = logger(modulename);


/**
 * Small translation module built around Polyglot.js.
 * For the future, its probably a good idea to upgrade to i18next
 */
export default class Translator {
    constructor() {
        this.language = globals.config.language;
        this.polyglot = null;
        this.customLocalePath = path.join(txEnv.dataPath, 'locale.json');

        //Load language
        this.setupTranslator(true);
    }


    //================================================================
    /**
     * Setup polyglot instance
     */
    setupTranslator(isFirstTime = false) {
        try {
            const phrases = this.getLanguagePhrases(this.language);
            const polyglotOptions = {
                allowMissing: false,
                onMissingKey: (key) => {
                    logError(`Missing key '${key}' from translation file.`, 'Translator');
                    return key;
                },
                phrases,
            };
            this.polyglot = new Polyglot(polyglotOptions);
        } catch (error) {
            logError(error.message);
            if (isFirstTime) process.exit();
        }
    }


    //================================================================
    /**
     * Refresh translator configurations
     */
    refreshConfig() {
        //Change config and restart polyglot
        this.language = globals.config.language;
        this.setupTranslator(false);

        //Rebuild Monitor's schedule with new text and refreshes fxserver convars
        try {
            globals.fxRunner.resetConvars();
        } catch (error) {
            if (verbose) dir(error);
        }
    }


    //================================================================
    /**
     * Loads a language file or throws Error.
     * @param {string} lang
     */
    getLanguagePhrases(lang) {
        if (typeof localeMap[lang] === 'object') {
            //If its a known language
            return localeMap[lang];

        } else if (lang === 'custom') {
            //If its a custom language
            try {
                return JSON.parse(fs.readFileSync(
                    this.customLocalePath,
                    'utf8',
                ));
            } catch (error) {
                throw new Error(`Failed to load '${this.customLocalePath}'. (${error.message})`);
            }

        } else {
            //If its an invalid language
            throw new Error('Language not found.');
        }
    }


    //================================================================
    /**
     * Perform a translation (polyglot.t)
     * @param {string} key
     * @param {object} options
     */
    t(key, options) {
        if (typeof options === 'undefined') options = {};
        try {
            return this.polyglot.t(key, options);
        } catch (error) {
            logError(`Error performing a translation with key '${key}'`);
            return key;
        }
    }
};
