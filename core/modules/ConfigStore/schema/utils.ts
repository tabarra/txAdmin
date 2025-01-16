import { z } from 'zod';
import { SYM_FIXER_DEFAULT, SYM_FIXER_FATAL } from '../configSymbols';


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
export type ScopeConfigItem = DefinedConfigItem | NulledConfigItem;

//NOTE: Split into two just because I couldn't figure out how to make the default value be null
export const typeDefinedConfig = <T>(config: DefinedConfigItem<T>): DefinedConfigItem<T> => config;
export const typeNullableConfig = <T>(config: NulledConfigItem<T>): NulledConfigItem<T> => config;
