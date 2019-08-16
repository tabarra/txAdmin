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

        //Rebuild Monitor's schedule with new text
        try {
            globals.monitor.buildSchedule();
        } catch (error) {}
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
        let langHashes = {
            en: '1B789F2CEA55265CA0379C6A2F1D9FAC363580F6',
            pt_BR: '9A07FC453D2FDEB058089C14CA679A6F678D46ED',
        }
        if(langHashes.hasOwnProperty(lang)){
            let hash = crypto.createHash('SHA1').update(raw).digest("hex").toUpperCase();
            if(hash !== langHashes[lang]) thrower('Please do not modify this file. Revert the changes and use the Custom language setting.')
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
