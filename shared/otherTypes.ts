import type { ReactAuthDataType } from "./authApiTypes";
export type { BanTemplatesDataType, BanDurationType } from "@core/webroutes/banTemplates/utils";
export type { GetBanTemplatesSuccessResp } from "@core/webroutes/banTemplates/getBanTemplates";
export type { SaveBanTemplatesResp, SaveBanTemplatesReq } from "@core/webroutes/banTemplates/saveBanTemplates";
export type { ApiAddLegacyBanReqSchema, ApiRevokeActionReqSchema } from "@core/webroutes/history/actions";
export type { SvRtLogFilteredType, SvRtPerfCountsThreadType } from "@core/components/StatsManager/svRuntime/perfSchemas";
export type { SvRtPerfThreadNamesType } from "@core/components/StatsManager/svRuntime/config";
export type { PerfChartApiResp, PerfChartApiSuccessResp } from "@core/webroutes/perfChart";
export type { PlayerCrashesApiResp, PlayerCrashesApiSuccessResp } from "@core/webroutes/playerCrashes";


export type UpdateDataType = {
    version: string;
    isImportant: boolean;
} | undefined;

export type ThemeType = {
    name: string;
    isDark: boolean;
    style: { [key: string]: string };
};

export type AdsDataType = {
    login: false | { img: string, url: string };
    main: false | { img: string, url: string };
}

export type InjectedTxConsts = {
    //Env
    fxsVersion: string;
    fxsOutdated: UpdateDataType,
    txaVersion: string;
    txaOutdated: UpdateDataType,

    serverTimezone: string;
    isZapHosting: boolean;
    isPterodactyl: boolean;
    isWebInterface: boolean;
    showAdvanced: boolean;
    hasMasterAccount: boolean;
    defaultTheme: string;
    customThemes: Omit<ThemeType, 'style'>[];
    adsData: AdsDataType;

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
