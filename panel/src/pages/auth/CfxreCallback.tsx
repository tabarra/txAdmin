import { useAuth } from "@/hooks/auth";
import { ApiOauthCallbackErrorResp, ApiOauthCallbackReq, ApiOauthCallbackResp } from "@shared/authApiTypes";
import { useEffect, useRef, useState } from "react";
import { AuthError, checkCommonOauthErrors, processFetchError } from "./errors";
import GenericSpinner from "@/components/GenericSpinner";
import { fetchWithTimeout } from "@/hooks/fetch";


export default function CfxreCallback() {
    const hasPendingMutation = useRef(false); //due to strict mode re-rendering
    const { authData, setAuthData } = useAuth();
    const [errorData, setErrorData] = useState<ApiOauthCallbackErrorResp | undefined>(checkCommonOauthErrors);
    const [isFetching, setIsFetching] = useState(false);

    const submitCallback = async () => {
        try {
            setIsFetching(true);
            const data = await fetchWithTimeout<ApiOauthCallbackResp, ApiOauthCallbackReq>(
                `/auth/cfxre/callback`,
                {
                    method: 'POST',
                    body: {
                        redirectUri: window.location.href
                    },
                }
            );
            if ('errorCode' in data || 'errorTitle' in data) {
                setErrorData(data);
            } else {
                setAuthData(data);
            }
        } catch (error) {
            setErrorData(processFetchError(error));
        } finally {
            setIsFetching(false);
        }
    }

    useEffect(() => {
        if (authData || hasPendingMutation.current) return;
        hasPendingMutation.current = true;
        const urlError = checkCommonOauthErrors();
        if (urlError) {
            setErrorData(urlError);
            return;
        }
        submitCallback();
    }, []);

    if (errorData) {
        return <AuthError error={errorData} />;
    } else if (isFetching) {
        return <GenericSpinner msg="Logging in..." />;
    } else {
        return <GenericSpinner />;
    }
}
