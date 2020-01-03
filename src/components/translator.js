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
        // Also, to generate this list run the handy dandy `src/scripts/hash-locale.js`
        let langHashes = {
            cs: '7b8d67e0344fdeda521c6f61b4f941207b229a36', //Czech
            da: '75d9dc164b34bf93348cdc88841b73a17b86f901', //Danish
            de: '67e86da0d15f825758bda4bb1a398adfc9b56cf1', //German
            en: '830a8fc8963c3144715e887d1e3b93ce9b7ca2c2', //English
            es: 'eca44993f43dcdd265bfc476c5abc368f222e051', //Spanish
            fi: 'a4504009b10ba3f4bb776171ae708912bb20e1f7', //Finnish
            fr: 'eee8f40e27945125cb4684863546f2143f572d24', //French
            hu: 'c7e3b779a88447e0db8ca08b64ec633368bc1196', //Hungarian
            lv: '787526d0edafbc7114c5efb942167fa6b4513f65', //Latvian
            nl: '4be7a53b05922a2ec61faa1556ad1095957e9793', //Dutch
            pl: 'a11082bc58b405302f4581dd472ddc9d0e4254ba', //Polish
            pt_BR: 'c1f29814b2639e35c142f1e9417cb0216a6a6bac', //Portuguese (Brazil)
            ro: 'b1563a06793ac3177391a3d35070f1a7d83e077a', //Romanian
            th: '0c7b70ee1db9fc8eafbb73b2c2e30db0e181cf10', //Thai
            tr: 'c0016703741c008b7b961183304526e816723085', //Turkish
            zh: 'ce1d259f097bd047ad3ce5a2b5a1d675b5efe3d3', //Chinese
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
