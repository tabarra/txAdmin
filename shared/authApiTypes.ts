import { ApiAuthErrorResp } from "genericApiTypes";
import { ApiVerifyPasswordReqSchema } from '../core/webroutes/authentication/verifyPassword';

export type ReactAuthDataType = {
    name: string;
    permissions: string[];
    isMaster: boolean;
    isTempPassword: boolean;
    profilePicture?: string;
    csrfToken?: string;
}

export type ApiSelfResp = ApiAuthErrorResp | ReactAuthDataType;

export type ApiLogoutResp = {
    logout: true;
};


export type ApiVerifyPasswordReq = ApiVerifyPasswordReqSchema;
export type ApiVerifyPasswordResp = {
    error: string;
} | ReactAuthDataType;


export type ApiOauthRedirectResp = {
    partialAuthUrl: string;
    state: string;
}


export type ApiOauthCallbackReq = {
    redirectUri: string;
}
export type ApiOauthCallbackResp = {
    error: string;
} | ReactAuthDataType;


export type ApiAddMasterPinReq = {
    pin: string;
}
export type ApiAddMasterPinResp = ApiOauthRedirectResp;

export type ApiAddMasterCallbackReq = ApiOauthCallbackReq;

export type ApiAddMasterSaveReq = {
    password: string;
}
export type ApiAddMasterSaveResp = {
    error: string;
} | ReactAuthDataType;
