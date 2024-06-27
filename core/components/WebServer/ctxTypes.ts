import TxAdmin from "@core/txAdmin";
import { ParameterizedContext } from "koa";
import { CtxTxVars } from "./middlewares/ctxVarsMw";
import { CtxTxUtils } from "./middlewares/ctxUtilsMw";
import { AuthedAdminType } from "./authLogic";
import { SessToolsType } from "./middlewares/sessionMws";
import { Socket } from "socket.io";


//Right as it comes from Koa
export type RawKoaCtx = ParameterizedContext<
    { [key: string]: unknown }, //state
    { [key: string]: unknown }, //context
    unknown //response
>;

//After passing through the libs (session, serve, body parse, etc)
export type CtxWithSession = RawKoaCtx & {
    sessTools: SessToolsType;
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

//The socket.io version of "context"
export type SocketWithSession = Socket & {
    sessTools: SessToolsType;
};
