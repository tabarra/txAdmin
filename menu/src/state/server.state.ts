import { atom, selector, useRecoilValue } from 'recoil';
import config from "../utils/config.json";
import { fetchNui } from '../utils/fetchNui';
import { debugLog } from '../utils/debugLog';
import { isBrowserEnv } from '../utils/miscUtils';

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
}

const serverCtx = atom<ServerCtx>({
  key: "serverCtx",
  default: selector<ServerCtx>({
    key: 'serverCtxFetch',
    get: async () => {
      try {
        const serverCtx = await fetchNui<ServerCtx>('getServerCtx')
        debugLog('GetServerCtx', serverCtx)
        return serverCtx
      } catch (e) {
        console.error(e)
        return config.serverCtx
      }
    }
  })
});

export const useServerCtxValue = () => useRecoilValue(serverCtx);