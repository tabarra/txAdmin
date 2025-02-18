
const modulename = 'WebServer:OauthMethods';
import { InitializedCtx } from "@modules/WebServer/ctxTypes";
import { ValidSessionType } from "@modules/WebServer/middlewares/sessionMws";
import { ApiOauthCallbackErrorResp, ApiOauthCallbackResp } from "@shared/authApiTypes";
import { randomUUID } from "node:crypto";
import consoleFactory from '@lib/console';
import { UserInfoType } from "@modules/AdminStore/providers/CitizenFX";
const console = consoleFactory(modulename);


/**
 * Sets the user session and generates the provider redirect url
 */
export const getOauthRedirectUrl = (ctx: InitializedCtx, purpose: 'login' | 'addMaster', origin: string) => {
    const callbackUrl = origin + `/${purpose}/callback`;

    //Setting up session
    const sessData = {
        tmpOauthLoginStateKern: randomUUID(),
        tmpOauthLoginCallbackUri: callbackUrl,
    } satisfies ValidSessionType;
    ctx.sessTools.set(sessData);

    //Generate CitizenFX provider Auth URL
    const idmsAuthUrl = txCore.adminStore.providers.citizenfx.getAuthURL(
        callbackUrl,
        sessData.tmpOauthLoginStateKern,
    );

    return idmsAuthUrl;
}


/**
 * Handles the provider login callbacks by doing the code exchange, validations and returning the userInfo
 */
export const handleOauthCallback = async (ctx: InitializedCtx, redirectUri: string): Promise<ApiOauthCallbackErrorResp | UserInfoType> => {
    //Checking session
    const inboundSession = ctx.sessTools.get();
    if (!inboundSession || !inboundSession?.tmpOauthLoginStateKern || !inboundSession?.tmpOauthLoginCallbackUri) {
        return {
            errorCode: 'invalid_session',
        };
    }

    //Exchange code for access token
    let tokenSet;
    try {
        tokenSet = await txCore.adminStore.providers.citizenfx.processCallback(
            inboundSession.tmpOauthLoginCallbackUri,
            inboundSession.tmpOauthLoginStateKern,
            redirectUri,
        );
        if (!tokenSet) throw new Error('tokenSet is undefined');
        if (!tokenSet.access_token) throw new Error('tokenSet.access_token is undefined');
    } catch (e) {
        const error = e as any;
        console.warn(`Code Exchange error: ${error.message}`);
        if (error.tolerance !== undefined) {
            return {
                errorCode: 'clock_desync',
            };
        } else if (error.code === 'ETIMEDOUT') {
            return {
                errorCode: 'timeout',
            };
        } else if (error.message.startsWith('state mismatch')) {
            return {
                errorCode: 'invalid_state', //same as invalid_session?
            };
        } else {
            return {
                errorTitle: 'Code Exchange error:',
                errorMessage: error.message,
            };
        }
    }

    //Get userinfo
    try {
        return await txCore.adminStore.providers.citizenfx.getUserInfo(tokenSet.access_token);
    } catch (error) {
        console.verbose.error(`Get UserInfo error: ${(error as Error).message}`);
        return {
            errorTitle: 'Get UserInfo error:',
            errorMessage: (error as Error).message,
        };
    }
}
