import { z } from 'zod';

/**
 * MARK: Types
 */
//Definitions
export type ConfigScope = ListOf<DefinedConfigItem | NulledConfigItem>;
export type ConfigItemFixer<T> = (value: any) => T;
interface BaseConfigItem<T = unknown> {
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

//NOTE: Split into two just because I couldn't figure out how to make the default value be null
export const typeDefinedConfig = <T>(config: DefinedConfigItem<T>): DefinedConfigItem<T> => config;
export const typeNullableConfig = <T>(config: NulledConfigItem<T>): NulledConfigItem<T> => config;


/**
 * MARK: Schema Symbols
 */
//Symbol used to mark the validation fail behavior
export const SYM_FIXER_FATAL = Symbol('ConfigFixerFatalError');
export const SYM_FIXER_DEFAULT = Symbol('ConfigFixerFallbackDefault');
