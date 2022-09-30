import { useServerCtxValue } from "../state/server.state";
import { useMemo } from "react";
import localeMap from '@shared/localeMap';

export const useLocale = () => {
  const serverCtx = useServerCtxValue();

  return useMemo(() => {
    if (
      serverCtx.locale === "custom" &&
      typeof serverCtx.localeData === "object"
    ) {
      return serverCtx.localeData;
    } else {
      if (localeMap[serverCtx.locale]) {
        return localeMap[serverCtx.locale];
      } else {
        console.log(`Unable to find a locale with code ${serverCtx.locale} in cache, using English`);
        return localeMap.en;
      }
    }
  }, [serverCtx.locale, serverCtx.localeData]);
};
