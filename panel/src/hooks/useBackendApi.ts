import { txToast, validToastTypes } from "@/components/TxToaster";
import { useCsrfToken, useExpireAuthData } from "@/hooks/auth";
import { useEffect, useRef } from "react";

export enum ApiTimeout {
    DEFAULT = 7_500,
    LONG = 15_000,
    REALLY_LONG = 30_000,
    REALLY_REALLY_LONG = 45_000,
}

export class BackendApiError extends Error {
    title: string;
    message: string;

    constructor(title: string, message: string) {
        super();
        this.title = title;
        this.message = message;
    }
}

type HookOpts = {
    //I'm pretty sure the webpipe supports only GET and POST
    method: 'GET' | 'POST';
    path: string;
    abortOnUnmount?: boolean;
}

type ApiCallOpts<RespType, ReqType> = {
    pathParams?: {
        [key: string]: string;
    };
    queryParams?: {
        [key: string]: string | number | boolean;
    };
    timeout?: ApiTimeout;
    data?: ReqType;
    toastId?: string;
    toastLoadingMessage?: string;
    success?: (data: RespType, toastId?: string) => void;
    error?: (message: string, toastId?: string) => void;
}


/**
 * Hook that provides a function to call the txAdmin API
 */
export const useBackendApi = <
    RespType = any,
    ReqType = NonNullable<Object>,
>(hookOpts: HookOpts) => {
    const abortController = useRef<AbortController | undefined>(undefined);
    const currentToastId = useRef<string | undefined>(undefined);
    const expireSess = useExpireAuthData();
    const csrfToken = useCsrfToken();
    hookOpts.abortOnUnmount ??= false;
    useEffect(() => {
        return () => {
            if (!hookOpts.abortOnUnmount) return
            abortController.current?.abort();
            if (currentToastId.current) {
                txToast.dismiss(currentToastId.current);
            }
        }
    }, []);

    return async (opts: ApiCallOpts<RespType, ReqType>) => {
        //Processing URL
        let fetchUrl = hookOpts.path;
        if (opts.pathParams) {
            for (const [key, val] of Object.entries(opts.pathParams)) {
                fetchUrl = fetchUrl.replace(`/:${key}/`, `/${val.toString()}/`);
            }
        }
        if(opts.queryParams){
            const params = new URLSearchParams();
            for (const [key, val] of Object.entries(opts.queryParams)) {
                params.append(key, val.toString());
            }
            fetchUrl += `?${params.toString()}`;
        }
        const apiCallDesc = `${hookOpts.method} ${hookOpts.path}`;
        
        //Error handler
        const handleError = (title: string, msg: string) => {
            if (currentToastId.current) {
                txToast.error({ title, msg, }, { id: currentToastId.current });
            }
            if (opts.error) {
                try {
                    opts.error(msg, currentToastId.current);
                } catch (error) {
                    console.log('[ERROR CB ERROR]', apiCallDesc, error);
                }
            } else {
                throw new BackendApiError(title, msg);
            }
        }
        
        //Setting up toast
        if (opts.toastId && opts.toastLoadingMessage) {
            throw new Error(`[useBackendApi] toastId and toastLoadingMessage are mutually exclusive.`);
        } else if (opts.toastLoadingMessage) {
            currentToastId.current = txToast.loading(opts.toastLoadingMessage);
        } else if (opts.toastId) {
            currentToastId.current = opts.toastId;
        } else {
            //cleaning last toast id
            currentToastId.current = undefined;
        }
        
        //Starting timeout
        abortController.current = new AbortController();
        const timeoutId = setTimeout(() => {
            if (abortController.current?.signal.aborted) return;
            console.log('[TIMEOUT]', apiCallDesc);
            abortController.current?.abort();
            handleError('Request Timeout', 'If you closed txAdmin, please restart it and try again.');
        }, opts.timeout ?? ApiTimeout.DEFAULT);

        try {
            //Make request
            if (!csrfToken) throw new Error('CSRF token not set');
            console.log('[>>]', apiCallDesc);
            const resp = await fetch(fetchUrl, {
                method: hookOpts.method,
                headers: {
                    'Content-Type': 'application/json; charset=UTF-8',
                    'Accept': 'application/json',
                    'X-TxAdmin-CsrfToken': csrfToken,
                },
                body: opts.data ? JSON.stringify(opts.data) : undefined,
                signal: abortController.current?.signal,
            });
            clearTimeout(timeoutId);
            if (abortController.current?.signal.aborted) return;
            const data = await resp.json();
            if (data?.logout) {
                expireSess('api');
                throw new Error('Session expired');
            }

            //Success
            if (
                currentToastId.current
                && typeof data?.type === 'string'
                && typeof data?.msg === 'string'
                && validToastTypes.includes(data?.type)
                && typeof txToast[data.type as keyof typeof txToast] === 'function'
            ) {
                txToast[data.type as keyof typeof txToast](data, { id: currentToastId.current });
            }
            if (opts.success) {
                try {
                    opts.success(data, currentToastId.current);
                } catch (error) {
                    console.log('[SUCCESS CB ERROR]', apiCallDesc, error);
                }
            }
            return data as RespType;

        } catch (e) {
            if (abortController.current?.signal.aborted) return;
            let errorMessage = 'unknown error';
            const error = e as any;
            if (typeof error.message !== 'string') {
                errorMessage = JSON.stringify(error);
            } else if (error.message.startsWith('NetworkError')) {
                errorMessage = 'Network error.\nIf you closed txAdmin, please restart it and try again.';
            } else if (error.message.startsWith('JSON.parse:')) {
                errorMessage = 'Invalid JSON response from server.';
            } else {
                errorMessage = error.message;
            }
            console.error('[ERROR]', apiCallDesc, errorMessage);
            handleError('Request Error', errorMessage);
        }
    }
}
