import { ApiAuthErrorResp } from "./genericApiTypes";
import { ApiVerifyPasswordReqSchema } from '@core/routes/authentication/verifyPassword';
import { ApiOauthCallbackReqSchema } from "@core/routes/authentication/providerCallback";
import { ApiAddMasterPinReqSchema } from "@core/routes/authentication/addMasterPin";
import { ApiAddMasterCallbackReqSchema } from "@core/routes/authentication/addMasterCallback";
import { ApiAddMasterSaveReqSchema } from "@core/routes/authentication/addMasterSave";
import { ApiChangePasswordReqSchema } from "@core/routes/authentication/changePassword";
import { ApiChangeIdentifiersReqSchema } from "@core/routes/authentication/changeIdentifiers";

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
    authUrl: string;
} | {
    error: string;
};


export type ApiOauthCallbackReq = ApiOauthCallbackReqSchema;
export type ApiOauthCallbackErrorResp = {
    errorCode: string;
    errorContext?: {
        [key: string]: string;
    };
} | {
    errorTitle: string;
    errorMessage: string;
};
export type ApiOauthCallbackResp = ApiOauthCallbackErrorResp | ReactAuthDataType;


export type ApiAddMasterPinReq = ApiAddMasterPinReqSchema;
export type ApiAddMasterPinResp = ApiOauthRedirectResp;

export type ApiAddMasterCallbackReq = ApiAddMasterCallbackReqSchema;
export type ApiAddMasterCallbackFivemData = {
    fivemName: string;
    fivemId: string;
    profilePicture?: string;
}
export type ApiAddMasterCallbackResp = ApiOauthCallbackErrorResp | ApiAddMasterCallbackFivemData;

export type ApiAddMasterSaveReq = ApiAddMasterSaveReqSchema;
export type ApiAddMasterSaveResp = {
    error: string;
} | ReactAuthDataType;


export type ApiChangePasswordReq = ApiChangePasswordReqSchema;
export type ApiChangeIdentifiersReq = ApiChangeIdentifiersReqSchema;
