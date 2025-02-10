const modulename = 'ConfigStore:Parser';
import consoleFactory from "@lib/console";
import { ConfigFileData, ConfigScaffold } from "./schema";
import { ConfigScope, ListOf, ScopeConfigItem } from "./schema/utils";
import { confx, UpdateConfigKeySet } from "./utils";
import { cloneDeep } from "lodash";
import { dequal } from 'dequal/lite';
import { fromZodError } from "zod-validation-error";
import { SYM_FIXER_DEFAULT, SYM_RESET_CONFIG } from "@lib/symbols";
const console = consoleFactory(modulename);


// Returns object with all the scopes empty
// export const getConfigScaffold = (allConfigScopes: ListOf<ConfigScope>) => {
//     const scaffold: ConfigScaffold = Object.fromEntries(
//         Object.entries(allConfigScopes).map(([k, s]) => [k, {} as any])
//     );
//     return scaffold;
// };


// Returns object scope containing all the valid config values
export const getScopeDefaults = <T>(scope: ConfigScope): T => {
    return Object.fromEntries(
        Object.entries(scope)
            .map(([key, schema]) => [key, schema.default])
    ) as T;
};


// Returns object with all the scopes and their default values
export const getConfigDefaults = (allConfigScopes: ListOf<ConfigScope>) => {
    const defaults: ConfigScaffold = Object.fromEntries(
        Object.entries(allConfigScopes).map(([k, s]) => [k, getScopeDefaults(s)])
    );
    return defaults;
}


/**
 * Convert a config structure into a list of parsed config items
 */
export const parseConfigFileData = (configFileData: ConfigScaffold | ConfigFileData) => {
    const parsedConfigItems: ParsedConfigItem[] = [];
    for (const [scope, values] of Object.entries(configFileData)) {
        if (scope === 'version') continue;
        for (const [key, value] of Object.entries(values)) {
            if (value === undefined) continue;
            parsedConfigItems.push({ scope, key, value });
        }
    }
    return parsedConfigItems;
}
type ParsedConfigItem = {
    scope: string;
    key: string;
    value: any;
}


/**
 * Attempt to fix the value - USED DURING BOOTSTRAP ONLY
 */
const attemptConfigFix = (scope: string, key: string, value: any, configSchema: ScopeConfigItem) => {
    const shouldBeArray = Array.isArray(configSchema.default);
    if (configSchema.fixer === SYM_FIXER_DEFAULT) {
        if (shouldBeArray) {
            console.error(`Invalid value for '${scope}.${key}', applying default value.`);
        } else {
            console.error(`Invalid value for '${scope}.${key}', applying default value:`, configSchema.default);
        }
        return {
            success: true,
            value: configSchema.default,
        };
    } else if (typeof configSchema.fixer === 'function') {
        try {
            const fixed = configSchema.fixer(value);
            if (shouldBeArray) {
                console.error(`Invalid value for '${scope}.${key}' has been automatically fixed.`);
            } else {
                console.error(`Invalid value for '${scope}.${key}', the value has been fixed to:`, fixed);
            }
            return {
                success: true,
                value: fixed,
            };
        } catch (error) {
            console.error(`Invalid value for '${scope}.${key}', fixer failed with reason: ${(error as any).message}`);
            return {
                success: false,
                error,
            };
        }
    }
    return {
        success: false,
    };
}


/**
 * Processes a parsed config based on a schema to get the stored and active values
 */
export const bootstrapConfigProcessor = (
    parsedInput: ParsedConfigItem[],
    allConfigScopes: ListOf<ConfigScope>,
    defaultConfigs: ConfigScaffold,
) => {
    //Scaffold the objects
    const unknown: ListOf<any> = {};
    const stored: ListOf<any> = {};
    const active = cloneDeep(defaultConfigs);

    //Process each item
    for (const { scope, key, value } of parsedInput) {
        //Check if the scope is known
        const configSchema = allConfigScopes?.[scope]?.[key];
        if (!configSchema) {
            console.warn(`Unknown config: ${scope}.${key}`);
            unknown[scope] ??= {};
            unknown[scope][key] = value;
            continue;
        }
        stored[scope] ??= {};

        //Validate the value
        const zResult = configSchema.validator.safeParse(value);
        if (zResult.success) {
            stored[scope][key] = zResult.data;
            active[scope][key] = zResult.data;
            continue;
        }

        //Attempt to fix the value
        const fResult = attemptConfigFix(scope, key, value, configSchema);
        if (fResult.success && fResult.value !== undefined) {
            stored[scope][key] = fResult.value;
            active[scope][key] = fResult.value;
        } else {
            console.warn(`Invalid value for '${scope}.${key}': ${(zResult.error as any).message}`);
            throw fResult?.error ?? fromZodError(zResult.error, { prefix: `${scope}.${key}` });
        }
    }

    return { unknown, stored, active };
}


/**
 * Diff the parsed input against the stored and active configs, and validate the changes
 */
export const runtimeConfigProcessor = (
    parsedInput: ParsedConfigItem[],
    allConfigScopes: ListOf<ConfigScope>,
    storedConfigs: ConfigScaffold,
    activeConfigs: ConfigScaffold,
) => {
    //Scaffold the objects
    const storedKeysChanges = new UpdateConfigKeySet();
    const activeKeysChanges = new UpdateConfigKeySet();
    const thisStoredCopy = cloneDeep(storedConfigs);
    const thisActiveCopy = cloneDeep(activeConfigs);

    //Process each item
    for (const { scope, key, value } of parsedInput) {
        //Check if the scope is known
        const configSchema = confx(allConfigScopes).get(scope, key) as ScopeConfigItem;
        if (!configSchema) throw new Error(`Unknown config: ${scope}.${key}`);

        //Restore or Validate the value
        let newValue: any;
        if (value === SYM_RESET_CONFIG) {
            newValue = configSchema.default;
        } else {
            const zResult = configSchema.validator.safeParse(value);
            if (!zResult.success) {
                throw fromZodError(zResult.error, { prefix: configSchema.name });
            }
            newValue = zResult.data;
        }

        //Check if the value is different from the stored value
        const defaultValue = configSchema.default;
        const storedValue = confx(thisStoredCopy).get(scope, key);
        const isNewValueDefault = dequal(newValue, defaultValue);
        if (storedValue === undefined) {
            if (!isNewValueDefault) {
                storedKeysChanges.add(scope, key);
                confx(thisStoredCopy).set(scope, key, newValue);
            }
        } else if (!dequal(newValue, storedValue)) {
            storedKeysChanges.add(scope, key);
            if (!isNewValueDefault) {
                //NOTE: if default, it's being removed below already
                confx(thisStoredCopy).set(scope, key, newValue);
            }
        }

        //If the value is the default, remove
        if (isNewValueDefault) {
            confx(thisStoredCopy).unset(scope, key);
        }

        //Check if the value is different from the active value
        if (!dequal(newValue, confx(thisActiveCopy).get(scope, key))) {
            activeKeysChanges.add(scope, key);
            confx(thisActiveCopy).set(scope, key, newValue);
        }
    }

    return {
        storedKeysChanges,
        activeKeysChanges,
        stored: thisStoredCopy,
        active: thisActiveCopy,
    }
}
