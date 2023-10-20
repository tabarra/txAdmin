export type ReactPreauthType = {
    name: string;
    permissions: string[];
    isMaster: boolean;
    isTempPassword: boolean;
    profilePicture: any;
    csrfToken?: string;
}

export type InjectedTxConsts = {
    //Env
    fxServerVersion: string;
    txAdminVersion: string;
    isZapHosting: boolean;
    isPterodactyl: boolean;
    isWebInterface: boolean;
    showAdvanced: boolean;

    //Auth
    preAuth: ReactPreauthType | false;
}
