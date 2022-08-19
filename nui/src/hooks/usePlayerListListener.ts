import { useEffect } from "react";
import { txAdminMenuPage, usePageValue } from "../state/page.state";
import { useNuiEvent } from "./useNuiEvent";
import { useSetPlayersState } from "../state/players.state";
import { fetchNui } from "../utils/fetchNui";

export enum VehicleStatus {
  Unknown = "unknown",
  Walking = "walking",
  Driving = "driving",
  Flying = "flying", //planes or heli
  Boat = "boating",
  Biking = "biking",
}

export interface PlayerData {
  /**
   * Players server ID
   **/
  id: number;
  /**
   * No default value representing unknown state, this should always
   * reflect the player's actual name.
   **/
  name: string;
  /**
   * Player's vehicle status
   **/
  vType: VehicleStatus;
  /**
   * Distance in units between admin and player
   * Unknown distance due to client culling scope is passed as -1
   **/
  dist: number;
  /**
   * A non-normalized player health value
   * Can be only be 0-200
   **/
  health: number;
  /**
   * If this player is an admin
   **/
  admin: boolean;
}

export const usePlayerListListener = () => {
  const curPage = usePageValue();
  const setPlayerList = useSetPlayersState();

  useNuiEvent<PlayerData[]>("setPlayerList", setPlayerList);

  useEffect(() => {
    // Since our player list is never technically unmounted,
    // we target page changes as our interval entrance technique
    if (curPage !== txAdminMenuPage.Players) return;

    // Getting detailed playerlist
    fetchNui("signalPlayersPageOpen", {}, { mockResp: {} }).catch();

    // Getting detailed playerlist every 5 seconds
    const updaterInterval = window.setInterval(() => {
      fetchNui("signalPlayersPageOpen", {}, { mockResp: {} }).catch();
    }, 5000);

    return () => {
      window.clearInterval(updaterInterval);
    };
  }, [curPage]);
};
