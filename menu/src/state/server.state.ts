import { atom, useRecoilValue, useSetRecoilState } from "recoil";
import config from "../utils/config.json";

interface OneSyncCtx {
  type: null | string;
  status: boolean;
}

export interface CustomLocaleData {
  $meta: Record<string, unknown>;
  nui_menu: Record<string, unknown>;
  nui_warning: Record<string, unknown>;
}

export interface ServerCtx {
  oneSync: OneSyncCtx;
  projectName: null | string;
  maxClients: number;
  locale: string;
  localeData: CustomLocaleData | false;
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
