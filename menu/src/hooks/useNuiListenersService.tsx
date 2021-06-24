import { useSetIsMenuVisible } from "../state/visibility.state";
import {
  PlayerData,
  PlayerDataSetPartial,
  useSetPlayersState,
} from "../state/players.state";
import { txAdminMenuPage, useSetPage } from "../state/page.state";
import { useNuiEvent } from "./useNuiEvent";
import {
  PermCheckServerResp,
  useSetPermissions,
} from "../state/permissions.state";
import { fetchNuiAuth } from "../utils/fetchNuiAuth";

// Passive Message Event Listeners & Handlers for global state
export const useNuiListenerService = () => {
  const setVisible = useSetIsMenuVisible();
  const setPlayerState = useSetPlayersState();
  const setMenuPage = useSetPage();
  const setPermsState = useSetPermissions();

  useNuiEvent<boolean>("setDebugMode", (debugMode) => {
    (window as any).__MenuDebugMode = debugMode;
  });
  useNuiEvent<boolean>("setVisible", setVisible);
  useNuiEvent<PlayerDataSetPartial>("setPlayerState", (stateUpdate) => {
    setPlayerState((playerState) => {
      // merge the objects
      const oldStateMap: { [serverID: number]: PlayerData } = {};
      const foundIDs: number[] = [];
      
      playerState.forEach(playerData => oldStateMap[playerData.id] = {...playerData})
      Object.values(stateUpdate).forEach((playerData) => {
        const id = playerData.id
        if (!oldStateMap[id]) {
          oldStateMap[id] = playerData as PlayerData
        } else {
          for (const [k, v] of Object.entries(playerData)) {
            if (typeof v === 'undefined') continue;
            oldStateMap[id][k] = v
          }
        }
        foundIDs.push(+id)
        oldStateMap[id].id = +id
      })
      
      // remove players that have left
      Object.keys(oldStateMap).filter(id => !foundIDs.includes(+id))
        .forEach(id => delete oldStateMap[id]);
      
      return Object.values(oldStateMap)
    })
  });
  useNuiEvent<txAdminMenuPage>("setMenuPage", setMenuPage);
  useNuiEvent<PermCheckServerResp>("reAuth", () => {
    fetchNuiAuth().then(setPermsState);
  });
};
