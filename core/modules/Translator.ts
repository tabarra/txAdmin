const modulename = 'Translator';
import fs from 'node:fs';
import Polyglot from 'node-polyglot';
import { txEnv } from '@core/globalData';
import localeMap from '@shared/localeMap';
import consoleFactory from '@lib/console';
import fatalError from '@lib/fatalError';
import type { UpdateConfigKeySet } from './ConfigStore/utils';
const console = consoleFactory(modulename);


/**
 * Translation module built around Polyglot.js.
 * The locale files are indexed by the localeMap in the shared folder.
 */
export default class Translator {
    static readonly configKeysWatched = ['general.language'];

    public readonly customLocalePath = `${txEnv.dataPath}/locale.json`;
    public canonical: string = 'en-GB'; //Using GB instead of US due to date/time formats 
    #polyglot: Polyglot | null = null;

    constructor() {
        //Load language
        this.setupTranslator(true);
    }


    /**
     * Setup polyglot instance
     */
    setupTranslator(isFirstTime = false) {
        try {
            this.canonical = Intl.getCanonicalLocales(txConfig.general.language.replace(/_/g, '-'))[0];
        } catch (error) {
            this.canonical = 'en-GB';
        }

        try {
            const phrases = this.getLanguagePhrases(txConfig.general.language);
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
            if (isFirstTime) {
                fatalError.Translator(0, 'Failed to load initial language file', error);
            } else {
                console.dir(error);
            }
        }
    }


    /**
     * Handle updates to the config by resetting the translator
     */
    public handleConfigUpdate(updatedConfigs: UpdateConfigKeySet) {
        this.setupTranslator(false);
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
            throw new Error(`Language '${lang}' not found.`);
        }
    }


    /**
     * Perform a translation (polyglot.t)
     */
    t(key: string, options = {}) {
        if (!this.#polyglot) throw new Error(`polyglot not yet loaded`);

        try {
            return this.#polyglot.t(key, options);
        } catch (error) {
            console.error(`Error performing a translation with key '${key}'`);
            return key;
        }
    }
};
