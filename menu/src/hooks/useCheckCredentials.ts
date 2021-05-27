import { fetchWebPipe } from "../utils/fetchWebPipe";
import {
  PermCheckServerResp,
  useSetPermissions,
} from "../state/permissions.state";
import { debugLog } from "../utils/debugLog";
import { useNuiEvent } from "./useNuiEvent";

export const usesCheckCredentials = () => {
  const setPermsState = useSetPermissions();

  useNuiEvent("getNuiCredentials", () => {
    fetchWebPipe<PermCheckServerResp>("/auth/nui").then((result) => {
      debugLog("Get Auth Data", result);
      setPermsState(result);
    });
  });
};
