import {
  atom,
  selector,
  useRecoilState,
  useRecoilValue,
  useSetRecoilState,
} from "recoil";
import { fetchWebPipe } from "../utils/fetchWebPipe";
import { debugLog } from "../utils/debugLog";
import { MockedPlayerDetails } from "../utils/constants";
import { PlayerData } from "../hooks/usePlayerListListener";

enum HistoryActionType {
  Warn = "WARN",
  WarnRevoked = "WARN-REVOKED",
  Ban = "BAN",
  BanRevoked = "BAN-REVOKED",
  Whitelist = "WHITELIST",
  WhitelistRevoked = "WHITELIST-REVOKED",
}

interface PlayerHistoryItem {
  id: string;
  action: HistoryActionType;
  date: string;
  reason: string;
  author: string;
  color?: string;
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
      const assocPlayerId = assocPlayer.id;

      const res = await fetchWebPipe<TxAdminPlayerAPIResp>(
        `/player/${assocPlayerId}`,
        { mockData: MockedPlayerDetails }
      );

      debugLog("FetchWebPipe", res, "PlayerFetch");

      if (res.type === "offline") new Error(res.message);

      return res.logout !== true ? res : false;
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
