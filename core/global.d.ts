/**
 * MARK: txAdmin stuff
 */
type RefreshConfigFunc = import('@modules/ConfigStore/').RefreshConfigFunc;
interface GenericTxModuleInstance {
    public handleConfigUpdate?: RefreshConfigFunc;
    // public measureMemory?: () => { [key: string]: number };
}
declare interface GenericTxModule<T> {
    new(): InstanceType<T> & GenericTxModuleInstance;
    static readonly configKeysWatched?: string[];
}

declare type TxConfigs = import('@modules/ConfigStore/schema').TxConfigs
declare const txConfig: TxConfigs;

declare type TxCoreType = import('./txAdmin').TxCoreType;
declare const txCore: TxCoreType;

declare type TxManagerType = import('./txManager').TxManagerType;
declare const txManager: TxManagerType;

//FIXME: temporary
type AnythingButConfig = {
    config: never;
    [key: string]: any;
};
declare type TxAdminConfigsOld = {
    config: never,
    global: {
        serverName: string,
        language: string,
        menuEnabled: boolean,
        menuAlignRight: boolean,
        menuPageKey: string,

        hideDefaultAnnouncement: boolean,
        hideDefaultDirectMessage: boolean,
        hideDefaultWarning: boolean,
        hideDefaultScheduledRestartWarning: boolean,
        hideAdminInPunishments: boolean,
        hideAdminInMessages: boolean,
    },
    logger: AnythingButConfig,
    monitor: AnythingButConfig,
    playerDatabase: {
        onJoinCheckBan: boolean;
        banRejectionMessage: string;
        banRequiredHwidMatches: number;

        whitelistMode: 'disabled' | 'adminOnly' | 'guildMember' | 'guildRoles' | 'approvedLicense';
        whitelistDiscordRoles: string[];
        whitelistRejectionMessage: string;
    },
    webServer: import('@modules/WebServer').WebServerConfigType,
    discordBot: {
        enabled: boolean;
        token: string;
        guild: string;
        announceChannel: string;
        embedJson: string;
        embedConfigJson: string;
    },
    fxRunner: AnythingButConfig,
    banTemplates: AnythingButConfig,
};

declare type TxAdminConfigs = {
    config: never,
    general: {
        serverName: string,
        language: string,
    },
    gameFeatures: {
        menuEnabled: boolean,
        menuAlignRight: boolean,
        menuPageKey: string,
        hideDefaultAnnouncement: boolean,
        hideDefaultDirectMessage: boolean,
        hideDefaultWarning: boolean,
        hideDefaultScheduledRestartWarning: boolean,
        hideAdminInPunishments: boolean,
        hideAdminInMessages: boolean,
    },
    banlist: {
        enabled: boolean;
        rejectionMessage: string;
        requiredHwidMatches: number;
        banTemplates: AnythingButConfig,
    },
    whitelist: {
        mode: 'disabled' | 'adminOnly' | 'guildMember' | 'guildRoles' | 'approvedLicense';
        rejectionMessage: string;
        discordRoles: string[];
    },
    restarter: AnythingButConfig,
    fxRunner: AnythingButConfig,
    discordBot: import('@modules/DiscordBot').DiscordBotConfigType,
    webServer: import('@modules/WebServer').WebServerConfigType,

    logger: AnythingButConfig,
};
declare let txConfig: TxAdminConfigs;

declare type TxConsole = import('./lib/console').TxConsole;
declare namespace globalThis {
    interface Console extends TxConsole { }
}


/**
 * MARK: Natives
 * Natives extracted from https://www.npmjs.com/package/@citizenfx/server
 * I prefer extracting than importing the whole package because it's 
 * easier to keep track of what natives are being used.
 * 
 * To use the package, add the following line to the top of the file:
 * /// <reference types="@citizenfx/server" />
 */
declare function ExecuteCommand(commandString: string): void;
declare function GetConvar(varName: string, default_: string): string;
declare function GetCurrentResourceName(): string;
declare function GetPasswordHash(password: string): string;
declare function GetResourceMetadata(resourceName: string, metadataKey: string, index: number): string;
declare function GetResourcePath(resourceName: string): string;
declare function IsDuplicityVersion(): boolean;
declare function PrintStructuredTrace(payload: string): void;
declare function RegisterCommand(commandName: string, handler: Function, restricted: boolean): void;
declare function ScanResourceRoot(rootPath: string, callback: (data: object) => void): boolean;
declare function VerifyPasswordHash(password: string, hash: string): boolean;


/**
 * MARK: Fixes
 */
declare module 'unicode-emoji-json/data-ordered-emoji' {
    const emojis: string[];
    export = emojis;
}

//FIXME: checar se eu preciso disso
// interface ProcessEnv {
//     [x: string]: string | undefined;
// }
