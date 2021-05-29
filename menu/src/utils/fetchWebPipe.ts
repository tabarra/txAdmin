const WEBPIPE_PATH = 'https://monitor/WebPipe'

type ValidPath = `/${string}`

enum PipeTimeout {
  SHORT = 1500,
  MEDIUM = 5000,
  LONG = 9000
}

interface fetchWebPipeOpts {
  method?: 'GET' | 'POST',
  timeout?: PipeTimeout
  data?: unknown
}
/**
 * A wrapper around fetch for HTTP reqs to the txAdminPipe
 * @param path The path to send the req to
 * @param options Additional options to control the fetch event's behavior
 **/
export const fetchWebPipe = async <T = any>(path: ValidPath, options?: fetchWebPipeOpts): Promise<T> => {
  const reqPath = WEBPIPE_PATH + path
  const timeout = options?.timeout || PipeTimeout.MEDIUM

  const abortionController = new AbortController();
  const timeoutId = setTimeout(() => abortionController.abort(), timeout)

  const fetchOpts: RequestInit = {
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
    },
    method: options?.method,
    body: JSON.stringify(options?.data),
    signal: abortionController.signal
  }

  const resp = await fetch(reqPath, fetchOpts)
  clearTimeout(timeoutId)

  return await resp.json()
}