/**
 * ConfigStore Schemas
 */
//Symbols used to mark the validation fail behavior
export const SYM_FIXER_FATAL = Symbol('ConfigSchema:FixerFatalError');
export const SYM_FIXER_DEFAULT = Symbol('ConfigSchema:FixerFallbackDefault');

//Other symbols
export const SYM_RESET_CONFIG = Symbol('ConfigSchema:SaverResetConfig');


/**
 * Other symbols
 */
export const SYM_SYSTEM_AUTHOR = Symbol('Definition:AuthorIsSystem');
export const SYM_CURRENT_MUTEX = Symbol('Definition:CurrentServerMutex');
