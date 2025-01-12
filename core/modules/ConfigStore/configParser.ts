const modulename = 'ConfigStore:Parser';
import consoleFactory from "@lib/console";
import { ConfigFileData, ConfigScaffold } from "./schema";
import { ConfigScope, ListOf, SYM_FIXER_DEFAULT } from "./schema/utils";
const console = consoleFactory(modulename);


// Returns object with all the scopes empty
export const getConfigScaffold = (allConfigScopes: ListOf<ConfigScope>) => {
    const scaffold: ConfigScaffold = Object.fromEntries(
        Object.entries(allConfigScopes).map(([k, s]) => [k, {} as any])
    );
    return scaffold;
};


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


// Convert a config structure into a list of parsed config items
export const parseConfigFileData = (configFileData: ConfigFileData) => {
    const parsedConfigItems: ParsedConfigItem[] = [];
    for (const [scope, values] of Object.entries(configFileData)) {
        if (scope === 'version') continue;
        for (const [key, value] of Object.entries(values)) {
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
 * Processes a parsed config based on a schema to get the stored and active values
 */
export const processParsedConfigs = (parsedInput: ParsedConfigItem[], allConfigScopes: ListOf<ConfigScope>) => {
    //Scaffold the objects
    const stored = getConfigScaffold(allConfigScopes);
    const active = getConfigDefaults(allConfigScopes);

    //Process each line
    for (const { scope, key, value } of parsedInput) {
        //Check if the scope is known
        const configSchema = allConfigScopes?.[scope]?.[key];
        if (!configSchema) {
            console.warn(`Unknown config: ${scope}.${key}`);
            stored[scope] ??= {};
            stored[scope][key] = value;
            continue;
        }

        //Validate the value
        const zResult = configSchema.validator.safeParse(value);
        if (zResult.success) {
            stored[scope][key] = zResult.data;
            active[scope][key] = zResult.data;
            continue;
        }

        //Attempt to fix the value
        const shouldBeArray = Array.isArray(active[scope][key]);
        if (configSchema.fixer === SYM_FIXER_DEFAULT) {
            if (shouldBeArray) {
                console.error(`Invalid value for '${scope}.${key}', applying default value.`);
            } else {
                console.error(`Invalid value for '${scope}.${key}', applying default value:`, configSchema.default);
            }
            stored[scope][key] = configSchema.default;
            active[scope][key] = configSchema.default;
        } else if (typeof configSchema.fixer === 'function') {
            try {
                const fixed = configSchema.fixer(value);
                if (shouldBeArray) {
                    console.error(`Invalid value for '${scope}.${key}' has been automatically fixed.`);
                } else {
                    console.error(`Invalid value for '${scope}.${key}', the value has been fixed to:`, fixed);
                }
                stored[scope][key] = fixed;
                active[scope][key] = fixed;
            } catch (error) {
                throw new Error(`Invalid value for '${scope}.${key}', fixer failed with reason: ${(error as any).message}`);
            }
        } else {
            throw new Error(`Invalid value for '${scope}.${key}': ${(zResult.error as any).message}`);
        }
    }

    return { stored, active };
}
