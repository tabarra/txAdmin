import { ReactAuthDataType } from "./authApiTypes";

export type ThemeType = {
    name: string;
    isDark: boolean;
    style: {[key: string]: string};
};

export type InjectedTxConsts = {
    //Env
    fxServerVersion: string;
    txAdminVersion: string;
    isZapHosting: boolean;
    isPterodactyl: boolean;
    isWebInterface: boolean;
    showAdvanced: boolean;
    hasMasterAccount: boolean;
    defaultTheme: string;
    customThemes: Omit<ThemeType, 'style'>[];

    //Auth
    preAuth: ReactAuthDataType | false;
}


//Maybe extract to some shared folder
export type PlayerIdsObjectType = {
    discord: string | null;
    fivem: string | null;
    license: string | null;
    license2: string | null;
    live: string | null;
    steam: string | null;
    xbl: string | null;
};
