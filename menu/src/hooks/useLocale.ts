import { useServerCtxValue } from "../state/server.state";
import { useMemo } from "react";
import { getLocale } from "../utils/getLocale";

export const useLocale = () => {
  const serverCtx = useServerCtxValue();

  return useMemo(() => {
    if (
      serverCtx.locale === "custom" &&
      typeof serverCtx.localeData === "object"
    )
      return serverCtx.localeData;

    return getLocale(serverCtx.locale);
  }, [serverCtx.locale, serverCtx.localeData]);
};
