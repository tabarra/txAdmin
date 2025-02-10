import { z } from 'zod';
import { SYM_FIXER_DEFAULT, SYM_FIXER_FATAL } from '@lib/symbols';
import consts from '@shared/consts';
import { fromError } from 'zod-validation-error';


/**
 * MARK: Types
 */
//Definitions
export type ConfigScope = ListOf<DefinedConfigItem | NulledConfigItem>;
export type ConfigItemFixer<T> = (value: any) => T;
interface BaseConfigItem<T = unknown> {
    name: string;
    validator: z.Schema<T>;
    fixer: typeof SYM_FIXER_FATAL | typeof SYM_FIXER_DEFAULT | ConfigItemFixer<T>;
}

//Utilities
export type ListOf<T> = { [key: string]: T };
export interface DefinedConfigItem<T = unknown> extends BaseConfigItem<T> {
    default: T extends null ? never : T;
}
export interface NulledConfigItem<T = unknown> extends BaseConfigItem<T> {
    default: null;
}
export type ScopeConfigItem = DefinedConfigItem | NulledConfigItem;

//NOTE: Split into two just because I couldn't figure out how to make the default value be null
export const typeDefinedConfig = <T>(config: DefinedConfigItem<T>): DefinedConfigItem<T> => config;
export const typeNullableConfig = <T>(config: NulledConfigItem<T>): NulledConfigItem<T> => config;


/**
 * MARK: Common Schemas
 */
export const discordSnowflakeSchema = z.string().regex(
    consts.regexDiscordSnowflake,
    'The ID should be a 17-20 digit number.'
);


/**
 * MARK: Utilities
 */
export const getSchemaChainError = (chain: [schema: ScopeConfigItem, val: any][]) => {
    for (const [schema, val] of chain) {
        const res = schema.validator.safeParse(val);
        if (!res.success) {
            return fromError(res.error, { prefix: schema.name }).message;
        }
    }
}
