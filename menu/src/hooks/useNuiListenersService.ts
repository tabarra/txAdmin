import { useSetIsMenuVisible } from "../state/visibility.state";
import { PlayerData, useSetPlayersState } from "../state/players.state";
import { txAdminMenuPage, useSetPage } from "../state/page.state";
import { useNuiEvent } from "./useNuiEvent";
import { useSetServerCtx } from "../state/server.state";

// Passive Message Event Listeners & Handlers for global state
export const useNuiListenerService = () => {
  const setVisible = useSetIsMenuVisible();
  const setPlayerState = useSetPlayersState();
  const setMenuPage = useSetPage();

  useNuiEvent<boolean>("setVisible", setVisible);
  useNuiEvent<PlayerData[]>("setPlayerState", setPlayerState);
  useNuiEvent<txAdminMenuPage>("setMenuPage", setMenuPage);
  useNuiEvent("setServerCtx", useSetServerCtx)
};
