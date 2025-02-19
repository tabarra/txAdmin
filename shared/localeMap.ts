//NOTE: Don't modify the structure of this file without updating the locale:check script.

//Statically requiring languages because of the builders
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
import lang_hr from "@locale/hr.json";
import lang_hu from "@locale/hu.json";
import lang_id from "@locale/id.json";
import lang_it from "@locale/it.json";
import lang_ja from "@locale/ja.json";
import lang_lt from "@locale/lt.json";
import lang_lv from "@locale/lv.json";
import lang_mn from "@locale/mn.json";
import lang_ne from "@locale/ne.json";
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
import lang_uk from "@locale/uk.json";
import lang_vi from "@locale/vi.json";
import lang_zh from "@locale/zh.json";

export type LocaleType = typeof lang_en;
export type LocaleMapType = {
    [key: string]: LocaleType;
}

const localeMap: LocaleMapType = {
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
    hr: lang_hr,
    hu: lang_hu,
    id: lang_id,
    it: lang_it,
    ja: lang_ja,
    lt: lang_lt,
    lv: lang_lv,
    mn: lang_mn,
    ne: lang_ne,
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
    uk: lang_uk,
    vi: lang_vi,
    zh: lang_zh,
};

export default localeMap;
