const WEBPIPE_PATH = 'https://monitor/WebPipe'

type ValidPath = `/${string}`

const REQ_TIMEOUT_SHORT = 1500;
const REQ_TIMEOUT_MEDIUM = 5000;
const REQ_TIMEOUT_LONG = 9000;

interface fetchWebPipeOpts {
  method?: 'GET' | 'POST',
  reqTimeoutLength?: number
  data: unknown
}
/**
 * A wrapper around fetch for HTTP reqs to the txAdminPipe
 * @param path The path to send the req to
 * @param options Additional options to control the fetch event's behavior
 **/
export const fetchWebPipe = async <T = any>(path: ValidPath, options?: fetchWebPipeOpts): Promise<T> => {
  const reqPath = WEBPIPE_PATH + path
  const timeout = options?.reqTimeoutLength || REQ_TIMEOUT_MEDIUM

  const abortionController = new AbortController();
  const timeoutId = setTimeout(() => abortionController.abort(), timeout)

  const fetchOpts: RequestInit = {
    method: options?.method,
    body: JSON.stringify(options?.data),
    signal: abortionController.signal
  }

  const resp = await fetch(reqPath, fetchOpts)
  clearTimeout(timeoutId)

  return await resp.json()
}