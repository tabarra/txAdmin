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
            cs: 'ac4c39180ba8d93ef5729be638f8226683abfec2', //Czech
            da: 'f4ed0196724d77e2b3e02a7f5fc5064e174939ff', //Danish
            de: '0afd698733c22dbd78793c861f09faf7bde393b6', //German
            en: '22aa51b1157b6f6fa7f712ddac5a78587084f43c', //English
            es: '6703e2293338888fd485325e03c979325328d461', //Spanish
            fr: '87e710bfc0cca31f7159a736b4c74d49c9c1f6f9', //French
            hu: '0cc944270bc6ea924faa4900dccde33d2651bb7f', //Hungarian
            nl: '4b3269c8b8644dad0f17ac3b5f1a8986590358c2', //Dutch
            pl: '7b54962c37b3f8befc7dcfab10c5a5c93b9e505f', //Polish
            pt_BR: '39136e5996e6ff4b6090c4e0a5759f21dc3c56d2', //Portuguese (Brazil)
            ro: '7cb38638a83349485bb0c2389f35adc7ec168b24', //Romanian
            zh: 'dd93a6fe7bfbbcdf99c2d239fc9be25b409a5a83', //Chinese
        }
        let hash = null;
        try {
            //FIXME: quickfix for git changing the line endings
            let toHash = JSON.stringify(JSON.parse(raw));
            hash = crypto.createHash('SHA1').update(toHash).digest("hex");
            if(globals.config.verbose) logOk(`Hash for ${lang} is ${hash}`, context);
        } catch (error) {
            if(globals.config.verbose) logError(error);
        }
        if(langHashes.hasOwnProperty(lang) && hash !== null && hash !== langHashes[lang]){
            thrower('Please do not modify this file. Revert the changes and use the Custom language setting.')
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
