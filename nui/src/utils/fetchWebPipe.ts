import { isBrowserEnv } from "./miscUtils";

const WEBPIPE_PATH = "https://monitor/WebPipe/nui";

type ValidPath = `/${string}`;

enum PipeTimeout {
  SHORT = 1500,
  MEDIUM = 5000,
  LONG = 9000,
}

interface fetchWebPipeOpts<T> {
  method?: "GET" | "POST";
  timeout?: PipeTimeout;
  data?: unknown;
  mockData?: T;
}
/**
 * A wrapper around fetch for HTTP reqs to the txAdminPipe
 * @param path The path to send the req to
 * @param options Additional options to control the fetch event's behavior
 **/
export const fetchWebPipe = async <T = any>(
  path: ValidPath,
  options?: fetchWebPipeOpts<T>
): Promise<T> => {
  const reqPath = WEBPIPE_PATH + path;
  const timeout = options?.timeout || PipeTimeout.MEDIUM;

  const abortionController = new AbortController();

  const fetchOpts: RequestInit = {
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
    },
    method: options?.method,
    body: JSON.stringify(options?.data),
    signal: abortionController.signal,
  };
  // Bail out of request if possible when browser
  if (isBrowserEnv() && options.mockData) {
    return options.mockData as unknown as T;
  }

  // Timeout logic for fetch request
  const timeoutId = setTimeout(() => abortionController.abort(), timeout);
  const resp = await fetch(reqPath, fetchOpts);
  clearTimeout(timeoutId);

  if (resp.status === 404) {
    return false;
  }

  return await resp.json();
};
