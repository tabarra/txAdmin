import type { DeepReadonly } from 'utility-types';

/**
 * The type of the TXDEV_ env variables
 */
export type TxDevEnvType = {
    //has default
    //set in scripts/build/dev.ts
    ENABLED: boolean,

    //required in core/webserver, core/getReactIndex.ts
    //set in scripts/build/dev.ts
    SRC_PATH?: string,

    //has default
    //required in core/getReactIndex.ts, panel/vite.config.ts
    VITE_URL: string,

    //must be in .env
    //required in scripts/dev.ts and nui/vite.config.ts
    FXSERVER_PATH?: string,

    //Can be used even without ENABLED
    VERBOSE: boolean, //has default
    CFXKEY?: string,
    STEAMKEY?: string,
    EXT_STATS_HOST?: string,
    LAUNCH_ARGS?: string[],
};
type EnvConfigsType<T> = {
    default?: T | T[],
    parser?: (val: string) => T | T[] | undefined,
};
type EnvConfigs = {
    [K in keyof TxDevEnvType]: EnvConfigsType<TxDevEnvType[K]>
};


/**
 * Configuration for the TXDEV_ env variables
 */
const envConfigs = {
    SRC_PATH: {},
    FXSERVER_PATH: {},
    VITE_URL: {
        default: 'http://localhost:40122',
    },

    ENABLED: {
        default: false,
        parser: (val) => Boolean(val)
    },
    VERBOSE: {
        default: false,
        parser: (val) => Boolean(val)
    },
    CFXKEY: {},
    STEAMKEY: {},
    EXT_STATS_HOST: {},
    LAUNCH_ARGS: {
        parser: (val) => {
            const filtered = val.split(/\s+/).filter(Boolean);
            return filtered.length ? filtered : undefined;
        }
    },
} satisfies EnvConfigs;


/**
 * Parses the TXDEV_ env variables
 */
export const parseTxDevEnv = () => {
    //@ts-ignore will be filled below
    const txDevEnv: TxDevEnvType = {};
    for (const key of Object.keys(envConfigs)) {
        const keyConfig = envConfigs[key as keyof TxDevEnvType];
        const value = process.env[`TXDEV_` + key];
        if (value === undefined) {
            if ('default' in keyConfig) {
                txDevEnv[key] = keyConfig.default;
            }
        } else {
            if ('parser' in keyConfig) {
                const parsed = keyConfig.parser(value);
                if (parsed !== undefined) {
                    txDevEnv[key] = parsed;
                }
            } else {
                txDevEnv[key] = value;
            }
        }
    }
    return txDevEnv;
}
