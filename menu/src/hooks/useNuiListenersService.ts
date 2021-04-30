import { useSetIsMenuVisible } from "../atoms/visibility.atom";
import { PlayerData, useSetPlayersState } from "../atoms/players.atom";
import { txAdminMenuPage, useSetPage } from "../atoms/page.atom";
import { useNuiEvent } from "./useNuiEvent";

// Passive Message Event Listeners & Handlers for global state
export const useNuiListenerService = () => {
  const setVisible = useSetIsMenuVisible();
  const setPlayerState = useSetPlayersState();
  const setMenuPage = useSetPage();

  useNuiEvent<boolean>("setVisible", setVisible);
  useNuiEvent<PlayerData[]>("setPlayerState", setPlayerState);
  useNuiEvent<txAdminMenuPage>("setMenuPage", setMenuPage);
};
