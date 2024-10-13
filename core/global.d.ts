declare global {
    namespace NodeJS {
        interface Global {
            globals: any;
        }
        interface ProcessEnv {
            [x: string]: string;
        }
    }
}

// fxserver natives extracted from https://www.npmjs.com/package/@citizenfx/server.
// Just installing the package did not work, but that's fine so this way I can more
// easily keep track of every native being used ant it wont slow down typescript.
declare function ExecuteCommand(commandString: string): void;
declare function GetConvar(varName: string, default_: string): string;
declare function GetCurrentResourceName(): string;
declare function GetPasswordHash(password: string): string;
declare function GetResourceMetadata(resourceName: string, metadataKey: string, index: number): string;
declare function GetResourcePath(resourceName: string): string;
declare function IsDuplicityVersion(): boolean;
declare function PrintStructuredTrace(payload: string): void;
declare function ScanResourceRoot(rootPath: string, callback: (data: object) => void): boolean;
declare function VerifyPasswordHash(password: string, hash: string): boolean;

declare namespace Intl {
    function getCanonicalLocales(locales: string | string[]): string[];
}

declare module 'unicode-emoji-json/data-ordered-emoji' {
    const emojis: string[];
    export = emojis;
}
