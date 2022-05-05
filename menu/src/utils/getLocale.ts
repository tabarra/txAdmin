// We decided to just bundle all the locales with the NUI bundle
// as this is easiest way of doing it without making a proxy event
// through client -> server -> txAdmin endpoint, this means we do
// have to manually import all these locales here.

// If we ever decide having this giant file is too much we can send up
// the proxy as noted above as this is the way I would normally do it on
// web

import ar from "../../../locale/ar.json";
import bs from "../../../locale/bs.json";
import cs from "../../../locale/cs.json";
import da from "../../../locale/da.json";
import de from "../../../locale/de.json";
import el from "../../../locale/el.json";
import en from "../../../locale/en.json";
import es from "../../../locale/es.json";
import et from "../../../locale/et.json";
import fa from "../../../locale/fa.json";
import fi from "../../../locale/fi.json";
import fr from "../../../locale/fr.json";
import hu from "../../../locale/hu.json";
import it from "../../../locale/it.json";
import lt from "../../../locale/lt.json";
import lv from "../../../locale/lv.json";
import nl from "../../../locale/nl.json";
import no from "../../../locale/no.json";
import pl from "../../../locale/pl.json";
import pt from "../../../locale/pt.json";
import ro from "../../../locale/ro.json";
import ru from "../../../locale/ru.json";
import sl from "../../../locale/sl.json";
import sv from "../../../locale/sv.json";
import th from "../../../locale/th.json";
import tr from "../../../locale/tr.json";
import zh from "../../../locale/zh.json";

const localeMap = {
  ar,
  bs,
  cs,
  da,
  de,
  el,
  en,
  es,
  et,
  fa,
  fi,
  fr,
  hu,
  it,
  lt,
  lv,
  nl,
  no,
  pl,
  pt,
  ro,
  ru,
  sl,
  sv,
  th,
  tr,
  zh,
};



export const getLocale = (localeCode: string): Object => {
  const locale = localeMap[localeCode];
  if (!locale){
    console.log(`Unable to find a locale with code ${localeCode} in cache, using English`);
    return localeMap.en;
  }
  return locale;
};
