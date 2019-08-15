//Requires
const fs = require('fs');
const crypto  = require('crypto');
const Polyglot = require('node-polyglot');
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../extras/console');
const context = 'Translator';


/**
 * Small translation module built around Polyglot.js.
 * For the future, its probably a good idea to upgrade to i18next
 */
module.exports = class Translator {
    constructor() {
        logOk('::Started', context);
        this.language = globals.config.language;
        this.polyglot = null;

        //Load language
        try {
            let phrases = this.getLanguagePhrases(this.language);
            let polyglotOptions = {
                allowMissing: false,
                onMissingKey: (key)=>{
                    logError(`Missing key '${key}' from translation file.`, 'Translator')
                    return key;
                },
                phrases
            }
            this.polyglot = new Polyglot(polyglotOptions);
        } catch (error) {
            logError(error.message, context);
            process.exit();
        }
    }


    //================================================================
    /**
     * Refresh translator configurations
     * @param {string} phrases
     */
    refreshConfig(phrases){
        //Load language
        try {
            let polyglotOptions = {
                allowMissing: false,
                onMissingKey: (key)=>{
                    logError(`Missing key '${key}' from translation file.`, 'Translator')
                    return key;
                },
                phrases
            }
            this.polyglot = new Polyglot(polyglotOptions);
        } catch (error) {
            logError(error.message, context);
            process.exit();
        }
    }


    //================================================================
    /**
     * Loads a language file or throws Error.
     * @param {string} lang
     */
    getLanguagePhrases(lang){
        let raw;
        let jsonData;

        const thrower = (msg) => {
            throw new Error(`Unable to load 'locale/${lang}.json'. (${msg})`);
        }

        try {
            raw = fs.readFileSync(`locale/${lang}.json`, 'utf8');
        } catch (error) {
            thrower('cannot read file');
        }

        //NOTE: this "protection" is to incentivize users to modify the git-untracked `locale/custom.json` file.
        // since modifying any other file will result in the user not being able to update txAdmin just by typing `git pull`.
        // This is being done just to the English translation file, add the others in the future? (write a script for generating a table).
        if(lang == 'en'){
            let hash = crypto.createHash('SHA1').update(raw).digest("hex");
            if(hash.toUpperCase() !== '00ECDB2DD63EF2B2F69DB2D302754A5113231D1F'){
                // HACK thrower('Please do not modify this file. Revert the changes and use the Custom language setting.')
            }
        }

        try {
            jsonData = JSON.parse(raw);
        } catch (error) {
            thrower('JSON parse error');
        }

        if(jsonData.constructor !== Object){
            thrower('JSON parse error - not an object');
        }

        return jsonData;
    }


    //================================================================
    /**
     * Perform a translation (polyglot.t)
     * @param {string} key
     * @param {object} options
     */
    t(key, options){
        if(typeof options === 'undefined') options = {};
        try {
            return this.polyglot.t(key, options);
        } catch (error) {
            logError(`Error performing a translation with key '${key}'`, context);
            return key;
        }
    }

} //Fim Translator()
