import { debugLog } from "./debugLog";
import { isBrowserEnv } from "./miscUtils";

type OptsWithMockData<T> = Partial<RequestInit & { mockResp: T }>;

/**
 * Simple wrapper around fetch API tailored for CEF/NUI use.
 * @param eventName - The endpoint eventname to target
 * @param data - Data you wish to send in the NUI Callback
 * @param opts - Request init opts to pass to fetch API
 * @return returnData - A promise for the data sent back by the NuiCallbacks CB argument
 */
export async function fetchNui<T = any>(
  eventName: string,
  data: unknown = {},
  opts?: OptsWithMockData<T>
): Promise<T> {
  const options = {
    ...opts,
    method: "post",
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify(data),
  };

  // debugLog(eventName, data, "PostToScripts");

  // If we are in browser and mockResp option is defined, we can
  // bail out of having to make failing HTTP reqs, speeding up data dispatching.
  if (isBrowserEnv() && opts?.mockResp) return opts.mockResp;

  try {
    const resp = await fetch(`https://monitor/${eventName}`, options);
    return await resp.json();
  } catch (error) {
    if (error.name === 'SyntaxError') {
      throw new Error(`JSON error. Maybe the NUI Callback \'${eventName}\' is not registered. This can be caused if the file that registers it has a lua syntax error.`);
    } else {
      throw error;
    }
  }
}
