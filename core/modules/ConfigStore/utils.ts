import type { RefreshConfigKey } from "./index";
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


/**
 * Helper class to deal with config keys
 */
export class UpdateConfigKeySet {
    public readonly raw: RefreshConfigKey[] = [];

    public add(input1: string, input2?: string) {
        let full, scope, key;
        if (input2) {
            full = `${input1}.${input2}`;
            scope = input1;
            key = input2;
        } else {
            full = input1;
            [scope, key] = input1.split('.');
        }
        if (full.includes('*')) {
            throw new Error('Wildcards are not allowed when adding config keys');
        }
        this.raw.push({ full, scope, key });
    }

    private _hasMatch(rule: string) {
        const [inputScope, inputKey] = rule.split('.');
        return this.raw.some(rawCfg =>
            (inputScope === '*' || rawCfg.scope === inputScope) &&
            (inputKey === '*' || rawCfg.key === inputKey)
        );
    }

    public hasMatch(rule: string | string[]) {
        if (Array.isArray(rule)) {
            return rule.some(f => this._hasMatch(f));
        } else {
            return this._hasMatch(rule);
        }
    }

    get size() {
        return this.raw.length;
    }

    get list() {
        return this.raw.map(x => x.full);
    }
}
