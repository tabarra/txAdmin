import { debugLog } from "./debugLog";

/**
 * Simple wrapper around fetch API tailored for CEF/NUI use.
 * @param eventName - The endpoint eventname to target
 * @param data - Data you wish to send in the NUI Callback
 *
 * @return returnData - A promise for the data sent back by the NuiCallbacks CB argument
 */
export async function fetchNui<T = any>(
  eventName: string,
  data?: any
): Promise<T> {
  const options = {
    method: "post",
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify(data),
  };

  debugLog(eventName, data, "PostToScripts");

  const resp = await fetch(`https://monitor/${eventName}`, options);

  return await resp.json();
}
