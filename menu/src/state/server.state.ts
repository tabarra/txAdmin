import { atom, selector, useRecoilValue } from "recoil";
import config from "../utils/config.json";
import { fetchNui } from "../utils/fetchNui";
import { debugLog } from "../utils/debugLog";

interface OneSyncCtx {
  type: null | string;
  status: boolean;
}

export interface ServerCtx {
  oneSync: OneSyncCtx;
  projectName: null | string;
  maxClients: number;
  locale: string;
  switchPageKey: string;
  txAdminVersion: string;
  endpoint: string;
  alignRight: boolean;
}

const serverCtx = atom<ServerCtx>({
  key: "serverCtx",
  default: selector<ServerCtx>({
    key: "serverCtxFetch",
    get: async () => {
      try {
        const serverCtx = await fetchNui<ServerCtx>("getServerCtx");
        debugLog("GetServerCtx", serverCtx);
        return serverCtx;
      } catch (e) {
        // This will error whenever the menu is disabled, so lets just silently
        // deal with it for now.
        // console.error(e)
        return <ServerCtx>config.serverCtx;
      }
    },
  }),
});

export const useServerCtxValue = () => useRecoilValue(serverCtx);
