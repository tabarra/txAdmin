import { atom, useRecoilValue, useSetRecoilState } from "recoil";
import config from "../utils/config.json";

interface OneSyncCtx {
  type: null | string;
  status: boolean;
}

interface CustomLocaleData {
  $meta: object;
  nui_menu: object;
  nui_warning: object;
}

export interface ServerCtx {
  oneSync: OneSyncCtx;
  projectName: null | string;
  maxClients: number;
  locale: string;
  localeData: CustomLocaleData | boolean;
  switchPageKey: string;
  txAdminVersion: string;
  alignRight: boolean;
}

const serverCtx = atom<ServerCtx>({
  key: "serverCtx",
  default: <ServerCtx>config.serverCtx,
});

export const useServerCtxValue = () => useRecoilValue(serverCtx);

export const useSetServerCtx = () => useSetRecoilState(serverCtx);
