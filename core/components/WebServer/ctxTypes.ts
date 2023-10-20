import TxAdmin from "@core/txAdmin";
import { ParameterizedContext } from "koa";
import { CtxTxVars } from "./middlewares/ctxVarsMw";
import { CtxTxUtils } from "./middlewares/ctxUtilsMw";
import { AuthedAdminType } from "./authLogic";

/**
 * Session stuff
 */
//From the koa-session docs, the DefinitelyTyped package is wrong.
export type DefaultCtxSession = Readonly<{
    isNew?: true;
    maxAge: number;
    externalKey: string;
    save: () => void;
    manuallyCommit: () => void;
}> & {
    auth?: any;
    [key: string]: unknown | undefined;
};

/**
 * The context types
 */
//Right as it comes from Koa
export type RawKoaCtx = ParameterizedContext<
    { [key: string]: unknown }, //state
    { [key: string]: unknown }, //context
    unknown //response
>;

//After passing through the libs (session, serve, body parse, etc)
export type CtxWithSession = RawKoaCtx & {
    session: DefaultCtxSession;
    request: any;
}

//After setupVarsMw
export type CtxWithVars = CtxWithSession & {
    txAdmin: TxAdmin;
    txVars: CtxTxVars;
}

//After setupUtilsMw
export type InitializedCtx = CtxWithVars & CtxTxUtils;

//After some auth middleware
export type AuthedCtx = InitializedCtx & {
    admin: AuthedAdminType;
}
