import { ConfigScaffold } from "./schema";


/**
 * A utility for manipulating a configuration scaffold with nested key-value structures.
 * Provides convenient methods to check, retrieve, set, and remove values in the configuration object.
 */
export const confx = (cfg: any) => {
    return {
        //Check if the config has a value defined
        has: (scope: string, key: string) => {
            return scope in cfg && key in cfg[scope] && cfg[scope][key] !== undefined;
        },
        //Get a value from the config
        get: (scope: string, key: string) => {
            return cfg[scope]?.[key] as any | undefined;
        },
        //Set a value in the config
        set: (scope: string, key: string, value: any) => {
            cfg[scope] ??= {};
            cfg[scope][key] = value;
        },
        //Remove a value from the config
        unset: (scope: string, key: string) => {
            let deleted = false;
            if (scope in cfg && key in cfg[scope]) {
                delete cfg[scope][key];
                deleted = true;
                if (Object.keys(cfg[scope]).length === 0) {
                    delete cfg[scope];
                }
            }
            return deleted;
        },
    };
};


/**
 * Not really intended for use, but it's a more type-safe version if you need it
 */
export const confxTyped = <T extends ConfigScaffold>(cfg: T) => {
    return {
        //Check if the config has a value defined
        has: (scope: keyof T, key: keyof T[typeof scope]) => {
            return scope in cfg && key in cfg[scope] && cfg[scope][key] !== undefined;
        },
        //Get a value from the config
        get: (scope: keyof T, key: keyof T[typeof scope]) => {
            if (scope in cfg && key in cfg[scope]) {
                return cfg[scope][key] as T[typeof scope][typeof key];
            } else {
                return undefined;
            }
        },
        //Set a value in the config
        set: (scope: keyof T, key: keyof T[typeof scope], value: any) => {
            cfg[scope] ??= {} as T[typeof scope];
            cfg[scope][key] = value;
        },
        //Remove a value from the config
        unset: (scope: keyof T, key: keyof T[typeof scope]) => {
            if (scope in cfg && key in cfg[scope]) {
                delete cfg[scope][key];
                if (Object.keys(cfg[scope]).length === 0) {
                    delete cfg[scope];
                }
            }
        },
    };
};
