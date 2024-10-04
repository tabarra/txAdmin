import { useSetIsMenuVisible } from "../state/visibility.state";
import { txAdminMenuPage, useSetPage } from "../state/page.state";
import { useNuiEvent } from "./useNuiEvent";
import {
  ResolvablePermission,
  useSetPermissions,
} from "../state/permissions.state";

import {
  ServerCtx,
  useSetServerCtx,
} from "../state/server.state";

// Passive Message Event Listeners & Handlers for global state
export const useNuiListenerService = () => {
  const setVisible = useSetIsMenuVisible();
  const setMenuPage = useSetPage();
  const setPermsState = useSetPermissions();
  const setServerCtxState = useSetServerCtx();

  useNuiEvent<boolean>("setDebugMode", (debugMode) => {
    (window as any).__MenuDebugMode = debugMode;
  });
  useNuiEvent<boolean>("setVisible", setVisible);
  useNuiEvent<ResolvablePermission[]>("setPermissions", setPermsState);
  useNuiEvent<ServerCtx>("setServerCtx", setServerCtxState);
  useNuiEvent<txAdminMenuPage>("setMenuPage", setMenuPage);
};
