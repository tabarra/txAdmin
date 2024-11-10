import type { ReactAuthDataType } from "./authApiTypes";
export type { BanTemplatesDataType, BanDurationType } from "@core/routes/banTemplates/utils";
export type { GetBanTemplatesSuccessResp } from "@core/routes/banTemplates/getBanTemplates";
export type { SaveBanTemplatesResp, SaveBanTemplatesReq } from "@core/routes/banTemplates/saveBanTemplates";
export type { ApiAddLegacyBanReqSchema, ApiRevokeActionReqSchema } from "@core/routes/history/actions";
export type { SvRtLogFilteredType, SvRtPerfCountsThreadType } from "@core/modules/Metrics/svRuntime/perfSchemas";
export type { SvRtPerfThreadNamesType } from "@core/modules/Metrics/svRuntime/config";
export type { PerfChartApiResp, PerfChartApiSuccessResp } from "@core/routes/perfChart";
export type { PlayerDropsApiResp, PlayerDropsApiSuccessResp, PlayerDropsDetailedWindow, PlayerDropsSummaryHour } from "@core/routes/playerDrops";
export type { PDLChangeEventType } from '@core/modules/Metrics/playerDrop/playerDropSchemas';


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
