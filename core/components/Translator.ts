const modulename = 'Translator';
import fs from 'node:fs';
import path from 'node:path';
import Polyglot from 'node-polyglot';
import { txEnv } from '@core/globalData';
import localeMap from '@shared/localeMap';
import consoleFactory from '@extras/console';
const console = consoleFactory(modulename);



/**
 * Small translation module built around Polyglot.js.
 * For the future, its probably a good idea to upgrade to i18next
 */
export default class Translator {
    language: string;
    canonical: string = 'en-GB';
    readonly customLocalePath: string;
    #polyglot: Polyglot | null = null;

    constructor() {
        this.language = globals.config.language;
        this.customLocalePath = path.join(txEnv.dataPath, 'locale.json');

        //Load language
        this.setupTranslator(true);
    }


    /**
     * Setup polyglot instance
     */
    setupTranslator(isFirstTime = false) {
        try {
            this.canonical = Intl.getCanonicalLocales(this.language.replace(/_/g, '-'))[0];
        } catch (error) {
            this.canonical = 'en-GB';
        }

        try {
            const phrases = this.getLanguagePhrases(this.language);
            const polyglotOptions = {
                allowMissing: false,
                onMissingKey: (key: string) => {
                    console.error(`Missing key '${key}' from translation file.`, 'Translator');
                    return key;
                },
                phrases,
            };
            this.#polyglot = new Polyglot(polyglotOptions);
        } catch (error) {
            console.dir(error);
            if (isFirstTime) process.exit();
        }
    }


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
            console.verbose.dir(error);
        }
    }


    /**
     * Loads a language file or throws Error.
     * @param {string} lang
     */
    getLanguagePhrases(lang: string) {
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
                throw new Error(`Failed to load '${this.customLocalePath}'. (${(error as Error).message})`);
            }

        } else {
            //If its an invalid language
            throw new Error('Language not found.');
        }
    }


    /**
     * Perform a translation (polyglot.t)
     */
    t(key: string, options = {}) {
        if(!this.#polyglot) throw new Error(`polyglot not yet loaded`);

        try {
            return this.#polyglot.t(key, options);
        } catch (error) {
            console.error(`Error performing a translation with key '${key}'`);
            return key;
        }
    }
};
