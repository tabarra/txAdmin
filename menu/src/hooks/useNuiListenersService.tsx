import { useSetIsMenuVisible } from "../state/visibility.state";
import { PlayerData, PlayerDataPartial, useSetPlayersState } from "../state/players.state";
import { txAdminMenuPage, useSetPage } from "../state/page.state";
import { useNuiEvent } from "./useNuiEvent";
import { useSetServerCtx } from "../state/server.state";
import { PermCheckServerResp, useSetPermissions } from "../state/permissions.state";
import { fetchNuiAuth } from "../utils/fetchNuiAuth";
import React from "react";

// Passive Message Event Listeners & Handlers for global state
export const useNuiListenerService = () => {
  const setVisible = useSetIsMenuVisible();
  const setPlayerState = useSetPlayersState();
  const setMenuPage = useSetPage();
  const setServerCtx = useSetServerCtx();
  const setPermsState = useSetPermissions();

  useNuiEvent<boolean>("setDebugMode", (debugMode) => {
    (window as any).__MenuDebugMode = debugMode
  })
  useNuiEvent<boolean>("setVisible", setVisible);
  useNuiEvent<PlayerDataPartial[]>("setPlayerState", stateUpdate => {
    setPlayerState(playerState => {
      // merge the objects
      const oldStateMap: { [serverID: number]: PlayerData } = {};
      playerState.forEach(playerData => oldStateMap[playerData.id] = {...playerData})
      stateUpdate.forEach(playerData => {
        if (!oldStateMap[playerData.id]) {
          oldStateMap[playerData.id] = playerData as PlayerData
        } else {
          for (const [k, v] of Object.entries(playerData)) {
            if (typeof v === 'undefined') continue;
            oldStateMap[playerData.id][k] = v
          }
        }
      })
      return Object.values(oldStateMap)
    })
  });
  useNuiEvent<txAdminMenuPage>("setMenuPage", setMenuPage);
  useNuiEvent<PermCheckServerResp>('reAuth', () => {
    fetchNuiAuth().then(setPermsState)
  })
  useNuiEvent("setServerCtx", setServerCtx);
};
