import { ReactAuthDataType } from "authApiTypes";

export type InjectedTxConsts = {
    //Env
    fxServerVersion: string;
    txAdminVersion: string;
    isZapHosting: boolean;
    isPterodactyl: boolean;
    isWebInterface: boolean;
    showAdvanced: boolean;
    hasMasterAccount: boolean;

    //Auth
    preAuth: ReactAuthDataType | false;
}
