import { fetchWebPipe } from "../utils/fetchWebPipe";
import {
  PermCheckServerResp,
  useSetPermissions,
} from "../state/permissions.state";
import { debugLog } from "../utils/debugLog";
import { useEffect } from 'react';

export const usesCheckCredentials = () => {
  const setPermsState = useSetPermissions();

  useEffect(() => {
    fetchWebPipe<PermCheckServerResp>("/auth/nui").then((result) => {
      debugLog("Get Auth Data", result, 'WebPipeReq');
      setPermsState(result);
    });
  }, [])
};
