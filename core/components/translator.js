const modulename = 'Translator';
import fs from 'node:fs';
import path from 'node:path';
import Polyglot from 'node-polyglot';
import logger from '@core/extras/console.js';
import { txEnv } from '@core/globalData.js';
const { dir, log, logOk, logWarn, logError } = logger(modulename);

//Statically requiring languages because of esbuild
//FIXME: Merge with nui\src\utils\getLocale.ts into a shared folder?
import lang_ar from "@locale/ar.json";
import lang_bg from "@locale/bg.json";
import lang_bs from "@locale/bs.json";
import lang_cs from "@locale/cs.json";
import lang_da from "@locale/da.json";
import lang_de from "@locale/de.json";
import lang_el from "@locale/el.json";
import lang_en from "@locale/en.json";
import lang_es from "@locale/es.json";
import lang_et from "@locale/et.json";
import lang_fa from "@locale/fa.json";
import lang_fi from "@locale/fi.json";
import lang_fr from "@locale/fr.json";
import lang_hu from "@locale/hu.json";
import lang_it from "@locale/it.json";
import lang_lt from "@locale/lt.json";
import lang_lv from "@locale/lv.json";
import lang_nl from "@locale/nl.json";
import lang_no from "@locale/no.json";
import lang_pl from "@locale/pl.json";
import lang_pt from "@locale/pt.json";
import lang_ro from "@locale/ro.json";
import lang_ru from "@locale/ru.json";
import lang_sl from "@locale/sl.json";
import lang_sv from "@locale/sv.json";
import lang_th from "@locale/th.json";
import lang_tr from "@locale/tr.json";
import lang_zh from "@locale/zh.json";

const localeMap = {
    ar: lang_ar,
    bg: lang_bg,
    bs: lang_bs,
    cs: lang_cs,
    da: lang_da,
    de: lang_de,
    el: lang_el,
    en: lang_en,
    es: lang_es,
    et: lang_et,
    fa: lang_fa,
    fi: lang_fi,
    fr: lang_fr,
    hu: lang_hu,
    it: lang_it,
    lt: lang_lt,
    lv: lang_lv,
    nl: lang_nl,
    no: lang_no,
    pl: lang_pl,
    pt: lang_pt,
    ro: lang_ro,
    ru: lang_ru,
    sl: lang_sl,
    sv: lang_sv,
    th: lang_th,
    tr: lang_tr,
    zh: lang_zh,
};

/**
 * Small translation module built around Polyglot.js.
 * For the future, its probably a good idea to upgrade to i18next
 */
export default class Translator {
    constructor() {
        // logOk('Started');
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
            globals.healthMonitor.buildSchedule();
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
        if (typeof localeMap[lang] === 'object') {
            return localeMap[lang];

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
};
