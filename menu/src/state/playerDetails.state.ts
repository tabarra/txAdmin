import {
  atom,
  selector,
  useRecoilState,
  useRecoilValue,
  useSetRecoilState,
} from "recoil";
import { PlayerData } from "./players.state";
import { fetchWebPipe } from "../utils/fetchWebPipe";
import { debugLog } from "../utils/debugLog";
import { MockedPlayerDetails } from "../utils/constants";

interface PlayerHistoryItem {
  id: string;
  action: string;
  date: string;
  reason: string;
  author: string;
  color?: string;
}

enum HistoryActionType {
  Warn = "WARN",
  WarnRevoked = "WARN-REVOKED",
  Kick = "KICK",
  Ban = "BAN",
  BanRevoked = "BAN-REVOKED",
  Whitelist = "WHITELIST",
  WhitelistRevoked = "WHITELIST-REVOKED",
}

interface TxAdminPlayerAPIResp {
  funcDisabled: {
    message: string;
    kick: string;
    warn: string;
    ban: boolean;
  };
  id: number | boolean;
  license: string;
  identifiers: string[];
  isTmp: boolean;
  name: string;
  actionHistory: PlayerHistoryItem[];
  joinDate: string;
  sessionTime: string;
  playTime: string;
  notesLog: string;
  notes: string;
  type?: string;
  message?: string;
}

const playerDetails = {
  selectedPlayerData: selector<TxAdminPlayerAPIResp>({
    key: "selectedPlayerDetails",
    get: async ({ get }) => {
      get(playerDetails.forcePlayerRefresh);
      const assocPlayer = get(playerDetails.associatedPlayer);
      const assocPlayerLicense = assocPlayer.license;

      try {
        const res = await fetchWebPipe<TxAdminPlayerAPIResp>(
          `/player/${assocPlayerLicense}`
        );

        debugLog("FetchWebPipe", res, "PlayerFetch");

        if (res.type === "offline") new Error(res.message);

        return res.logout !== true ? res : false;
      } catch (e) {
        if (process.env.DEV_MODE === "browser") {
          debugLog(
            "GetPlayerDetails",
            "Detected browser env, dispatching mock data",
            "WebPipeReq"
          );
          return MockedPlayerDetails;
        }
        throw e;
      }
    },
  }),
  forcePlayerRefresh: atom({
    key: "forcePlayerRefresh",
    default: 0,
  }),
  associatedPlayer: atom<PlayerData | null>({
    key: "associatedPlayerDetails",
    default: null,
  }),
};

export const usePlayerDetailsValue = () =>
  useRecoilValue<TxAdminPlayerAPIResp>(playerDetails.selectedPlayerData);

export const useForcePlayerRefresh = () =>
  useSetRecoilState(playerDetails.forcePlayerRefresh);

export const usePlayerDetails = () =>
  useRecoilState<TxAdminPlayerAPIResp>(playerDetails.selectedPlayerData);

export const useAssociatedPlayerValue = () =>
  useRecoilValue<PlayerData>(playerDetails.associatedPlayer);

export const useSetAssociatedPlayer = () =>
  useSetRecoilState<PlayerData>(playerDetails.associatedPlayer);
