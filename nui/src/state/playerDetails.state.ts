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
import { PlayerModalResp, PlayerModalSuccess } from "@shared/playerApiTypes";
import { GenericApiErrorResp } from "@shared/genericApiTypes";

const playerDetails = {
  selectedPlayerData: selector<PlayerModalResp | undefined>({
    key: "selectedPlayerDetails",
    get: async ({ get }) => {
      get(playerDetails.forcePlayerRefresh);
      const assocPlayer = get(playerDetails.associatedPlayer);
      if (!assocPlayer) return;
      const assocPlayerId = assocPlayer.id;

      const res: any = await fetchWebPipe<PlayerModalResp>(
        `/player?mutex=current&netid=${assocPlayerId}`,
        { mockData: MockedPlayerDetails }
      );
      debugLog("FetchWebPipe", res, "PlayerFetch");

      if (res.error) {
        return { error: (res as GenericApiErrorResp).error };
      } else if (res.player) {
        const player = (res as PlayerModalSuccess).player;
        if (player.isConnected) {
          return res;
        } else {
          return { error: 'This player is no longer connected to the server.' };
        }
      }else{
        return { error: 'Unknown error :(' };
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
  useRecoilValue<PlayerModalResp>(playerDetails.selectedPlayerData);

export const useForcePlayerRefresh = () =>
  useSetRecoilState(playerDetails.forcePlayerRefresh);

export const useAssociatedPlayerValue = () =>
  useRecoilValue<PlayerData>(playerDetails.associatedPlayer);

export const useSetAssociatedPlayer = () =>
  useSetRecoilState<PlayerData>(playerDetails.associatedPlayer);
