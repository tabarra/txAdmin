import { atom, useRecoilValue, useSetRecoilState } from "recoil";
import config from "../utils/config.json";

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
  alignRight: boolean;
}

const serverCtx = atom<ServerCtx>({
  key: "serverCtx",
  default: config.serverCtx,
});

export const useServerCtxValue = () => useRecoilValue(serverCtx);

export const useSetServerCtx = () => useSetRecoilState(serverCtx);
