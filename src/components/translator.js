//Requires
const modulename = 'Translator';
const fs = require('fs');
const path = require('path');
const Polyglot = require('node-polyglot');
const { dir, log, logOk, logWarn, logError } = require('../extras/console')(modulename);

//Statically requiring languages because of webpack
const languages = {
    ar: require('../../locale/ar.json'),
    bs: require('../../locale/bs.json'),
    cs: require('../../locale/cs.json'),
    da: require('../../locale/da.json'),
    de: require('../../locale/de.json'),
    el: require('../../locale/el.json'),
    en: require('../../locale/en.json'),
    es: require('../../locale/es.json'),
    et: require('../../locale/et.json'),
    fa: require('../../locale/fa.json'),
    fi: require('../../locale/fi.json'),
    fr: require('../../locale/fr.json'),
    hu: require('../../locale/hu.json'),
    it: require('../../locale/it.json'),
    lt: require('../../locale/lt.json'),
    lv: require('../../locale/lv.json'),
    nl: require('../../locale/nl.json'),
    no: require('../../locale/no.json'),
    pl: require('../../locale/pl.json'),
    pt: require('../../locale/pt.json'),
    ro: require('../../locale/ro.json'),
    ru: require('../../locale/ru.json'),
    sl: require('../../locale/sl.json'),
    sv: require('../../locale/sv.json'),
    th: require('../../locale/th.json'),
    tr: require('../../locale/tr.json'),
    zh: require('../../locale/zh.json'),
};

/**
 * Small translation module built around Polyglot.js.
 * For the future, its probably a good idea to upgrade to i18next
 */
module.exports = class Translator {
    constructor() {
        // logOk('Started');
        this.language = globals.config.language;
        this.polyglot = null;
        this.customLocalePath = path.join(GlobalData.dataPath, 'locale.json');

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
            globals.monitor.buildSchedule();
            globals.fxRunner.resetConvars();
        } catch (error) {}
    }


    //================================================================
    /**
     * Loads a language file or throws Error.
     * @param {string} lang
     */
    getLanguagePhrases(lang) {
        //If its a known language
        if (typeof languages[lang] === 'object') {
            return languages[lang];

        //If its a custom language
        } else if (lang === 'custom') {
            try {
                return JSON.parse(fs.readFileSync(
                    this.customLocalePath,
                    'utf8',
                ));
            } catch (error) {
                throw new Error(`Failed to load '${this.customLocalePath}'. (${error.message})`);
            }

        //If its an invalid language
        } else {
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
}; //Fim Translator()
