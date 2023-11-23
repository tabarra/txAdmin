import { useAuth } from "@/hooks/auth";
import { ApiOauthCallbackErrorResp, ApiOauthCallbackReq, ApiOauthCallbackResp } from "@shared/authApiTypes";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import OauthErrors from "./components/OauthErrors";
import GenericSpinner from "@/components/GenericSpinner";


export default function CfxreCallback() {
    const { authData, setAuthData } = useAuth();
    const [errorData, setErrorData] = useState<ApiOauthCallbackErrorResp | undefined>();
    const hasPendingMutation = useRef(false); //due to strict mode re-rendering

    const submitMutation = useMutation<
        ApiOauthCallbackResp,
        Error,
        ApiOauthCallbackReq
    >({
        mutationKey: ['auth'],
        mutationFn: ({ redirectUri }) => fetch('/auth/cfxre/callback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ redirectUri })
        }).then(res => res.json()),
        onSuccess: (data) => {
            if ('errorCode' in data || 'errorTitle' in data) {
                setErrorData(data);
            } else {
                setAuthData(data);
            }
        },
        onError: (error) => {
            if (error.message.startsWith('NetworkError')) {
                setErrorData({
                    errorTitle: 'Network Error',
                    errorMessage: 'If you closed txAdmin, please restart it and try again.'
                });
            } else {
                setErrorData({
                    errorTitle: 'Unknown Error',
                    errorMessage: error.message
                });
            }
        }
    });

    useEffect(() => {
        if (authData || hasPendingMutation.current) return;
        hasPendingMutation.current = true;
        submitMutation.mutate({
            redirectUri: window.location.href
        });
        return submitMutation.reset;
    }, []);

    return errorData ? <OauthErrors error={errorData} /> : <GenericSpinner msg="Logging in..." />
}
