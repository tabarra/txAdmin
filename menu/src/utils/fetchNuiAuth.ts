import {fetchWebPipe} from "./fetchWebPipe";
import {PermCheckServerResp} from "../state/permissions.state";
import {debugLog} from "./debugLog";

export async function fetchNuiAuth(): Promise<PermCheckServerResp> {
  return fetchWebPipe<PermCheckServerResp>("/auth/nui").then((result) => {
    debugLog("Get Auth Data", result, 'WebPipeReq');
    return result;
  });
}