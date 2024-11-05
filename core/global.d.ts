/**
 * MARK: txAdmin stuff
 */
declare interface GenericTxModule<T> {
    new(): T;
    // configKeys: string[]; //TODO
}

declare type TxCoreType = import('./txAdmin').TxCoreType;
declare const txCore: TxCoreType;

declare type TxManagerType = import('./txManager').TxManagerType;
declare const txManager: TxManagerType;


//FIXME: temporary
type AnythingButConfig = {
    config: never;
    [key: string]: any;
};
declare type TxAdminConfigs = {
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
    playerDatabase: import('@modules/PlayerDatabase').PlayerDbConfigType,
    webServer: import('@modules/WebServer').WebServerConfigType,
    discordBot: AnythingButConfig,
    fxRunner: AnythingButConfig,
    banTemplates: AnythingButConfig,
};
declare let txConfig: TxAdminConfigs;

//FIXME: prepare console
// interface Console {
//     bbb: Example<'toplevel.no-declare.Console'>;
// }
// declare namespace globalThis {
//     interface Console {
//         aaa: Example<'globalThis.no-declare.Console'>;
//     }
// }


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

//FIXME: checar se posso remover
// declare namespace Intl {
//     function getCanonicalLocales(locales: string | string[]): string[];
// }
