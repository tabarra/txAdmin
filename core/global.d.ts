//NOTE: don't import anything at the root of this file or it breaks the type definitions

/**
 * MARK: txAdmin stuff
 */
type RefreshConfigFunc = import('@modules/ConfigStore/').RefreshConfigFunc;
interface GenericTxModuleInstance {
    public handleConfigUpdate?: RefreshConfigFunc;
    public handleShutdown?: () => void;
    public timers?: NodeJS.Timer[];
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

declare type TxConsole = import('./lib/console').TxConsole;
declare namespace globalThis {
    interface Console extends TxConsole { }
}


//MARK: Runtime
/**
 * Minimal type declaration for Bun runtime detection.
 */
declare const Bun: { version: string } | undefined;


/**
 * FXServer natives extracted from https://www.npmjs.com/package/@citizenfx/server
 * I prefer extracting than importing the whole package because it's 
 * easier to keep track of what natives are being used.
 * 
 * To use the package, add the following line to the top of the file:
 * /// <reference types="@citizenfx/server" />
 */
declare const GetConvar: ((varName: string, default_: string) => string) | undefined;


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
