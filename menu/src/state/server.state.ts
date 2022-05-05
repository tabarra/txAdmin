import { atom, selector, useRecoilValue, useSetRecoilState } from "recoil";
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
  localeData: CustomLocaleData | boolean;
  switchPageKey: string;
  announceNotiPos: string;
  txAdminVersion: string;
  alignRight: boolean;
}

const serverCtx = atom<ServerCtx>({
  key: "serverCtx",
  default: config.serverCtx,
});

export const useServerCtxValue = () => useRecoilValue(serverCtx);

export const useSetServerCtx = () => useSetRecoilState(serverCtx);

interface AnnounceNotiLocation {
  vertical: "top" | "bottom";
  horizontal: "left" | "right" | "center";
}

const verifyNotiLocation = (vertical, horizontal) => {
  if (vertical !== "top" && vertical !== "bottom") {
    throw new Error(
      `Notification vertical position must be "top" or "bottom", but got ${vertical}`
    );
  }

  if (
    horizontal !== "left" &&
    horizontal !== "right" &&
    horizontal !== "center"
  ) {
    throw new Error(
      `Notification horizontal position must be "left", "right" or "center", but got ${horizontal}`
    );
  }

  return { vertical, horizontal };
};

const notiLocationSelector = selector<AnnounceNotiLocation>({
  key: "notiLocation",
  get: ({ get }) => {
    const notiTgtRaw = get(serverCtx).announceNotiPos;
    const [vertical, horizontal] = notiTgtRaw.split("-");

    try {
      return verifyNotiLocation(vertical, horizontal);
    } catch (e) {
      console.error(e);
      return { vertical: "top", horizontal: "center" };
    }
  },
});

export const useAnnounceNotiPosValue = () =>
  useRecoilValue(notiLocationSelector);
