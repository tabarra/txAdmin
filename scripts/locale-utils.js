import chalk from 'chalk';
import humanizeDuration from 'humanize-duration';
import { defaults, defaultsDeep, xor, difference } from 'lodash-es';
import fs from 'node:fs';
import path from 'node:path';

// Prepping
const defaultLang = JSON.parse(fs.readFileSync('./locale/en.json', 'utf8'));
const langFiles = fs.readdirSync('./locale/', { withFileTypes: true })
    .filter((dirent) => !dirent.isDirectory() && dirent.name.endsWith('.json') && dirent.name !== 'en.json')
    .map((dirent) => dirent.name);
const loadedLocales = langFiles.map((fName) => {
    const fPath = path.join('./locale/', fName);
    let raw, data;
    try {
        raw = fs.readFileSync(fPath, 'utf8');
        data = JSON.parse(raw);
    } catch (error) {
        console.log(chalk.red(`Failed to load ${fName}:`));
        console.log(error.message);
        process.exit(1);
    }
    return {
        name: fName,
        path: fPath,
        raw,
        data,
    };
});

// Clean en.json
// fs.writeFileSync('./locale/en.json', JSON.stringify(defaultLang, null, 4) + '\n');
// console.log('clean en.json');
// process.exit();

// const customLocale = 'E://FiveM//BUILDS//txData//locale.json';
// loadedLocales.push({
//     name: 'custom',
//     path: customLocale,
//     data: JSON.parse(fs.readFileSync(customLocale, 'utf8')),
// });

/**
 * Adds missing tags to files based on en.json
 */
const rebaseCommand = () => {
    console.log("Rebasing language files on 'en.json' for missing keys");
    for (const { name, path, data } of loadedLocales) {
        const synced = defaultsDeep(data, defaultLang);
        try {
            // synced.ban_messages.reject_temporary = undefined;
            // synced.ban_messages.reject_permanent = undefined;
            // synced.nui_menu.player_modal.info.notes_placeholder = "Notes about this player...";
            // synced.nui_menu.player_modal.history.action_types = undefined;
        } catch (error) {
            console.log(name);
            console.dir(error);
            process.exit();
        }

        // synced.nui_menu = defaultLang.nui_menu;
        const out = JSON.stringify(synced, null, 4) + '\n';
        fs.writeFileSync(path, out);
        console.log(`Edited file: ${name}`);
    }
    console.log(`Process finished: ${langFiles.length} files.`);
};

/**
 * Processes all locale files and "changes stuff"
 * This is just a quick way to do some stuff without having to open all files
 */
const processStuff = () => {
    // const joined = [];
    // for (const { name, path, data } of loadedLocales) {
    //     joined.push({
    //         file: name,
    //         language: data.$meta.label,
    //         instruction: data.nui_warning.instruction,
    //     });
    // }
    // const out = JSON.stringify(joined, null, 4) + '\n';
    // fs.writeFileSync('./locale-joined.json', out);
    // console.log(`Saved joined file`);

    // for (const { name, path, data } of loadedLocales) {
    //     // add stuff
    //     // data.nui_menu.player_modal.ids.all_hwids = 'All Hardware IDs';

    //     // remove stuff
    //     // data.whitelist_messages = undefined;

    //     // Save file - FIXME: commented out just to make sure i don't fuck it up by accident
    //     const out = JSON.stringify(data, null, 4) + '\n';
    //     fs.writeFileSync(path, out);
    //     console.log(`Edited file: ${name}`);
    // }
};

/**
 * Parses a locale file by "unfolding" it into an object of objects instead of strings
 */
function parseLocale(input, prefix = '') {
    if (!input) return {};
    let result = {};

    for (const [key, value] of Object.entries(input)) {
        const newPrefix = prefix ? `${prefix}.` : '';
        if (
            typeof value === 'object'
            && !Array.isArray(value)
            && value !== null
        ) {
            const recParse = parseLocale(value, `${newPrefix}${key}`);
            result = defaults(result, recParse);
        } else {
            if (typeof value === 'string') {
                const specials = value.matchAll(/(%{\w+}|\|\|\|\|)/g);
                result[`${newPrefix}${key}`] = {
                    value,
                    specials: [...specials].map((m) => m[0]),
                };
            } else {
                throw new Error(`Invalid value type '${typeof value}' for key '${newPrefix}${key}'`);
            }
        }
    }

    return result;
}

/**
 * Get a list of all mapped locales on shared/localeMap.ts
 */
const getMappedLocales = () => {
    const mapFileData = fs.readFileSync('./shared/localeMap.ts', 'utf8');
    const importRegex = /import lang_(?<fname>[\w\-]+) from "@locale\/(\k<fname>)\.json";/gm;
    const mappedImports = [...mapFileData.matchAll(importRegex)].map((m) => m.groups.fname);

    const mapRegex = /(?<tick>['"]?)(?<fname>[\w\-]+)(\k<tick>): lang_(\k<fname>),/gm;
    const mappedLocales = [...mapFileData.matchAll(mapRegex)].map((m) => m.groups.fname);

    return { mappedImports, mappedLocales };
};

/**
 * Checks all locale files for:
 * - localeMap.ts: bad import or mapping
 * - localeMap.ts: locale file not mapped
 * - localeMap.ts: import or mapping not alphabetically sorted
 * - invalid humanizer-duration language
 * - missing/excess keys
 * - mismatched specials (placeholders or smart time division)
 * - empty strings
 * - untrimmed strings
 */
const checkCommand = () => {
    console.log("Checking validity of the locale files based on 'en.json'.");
    const defaultLocaleParsed = parseLocale(defaultLang);
    const defaultLocaleKeys = Object.keys(defaultLocaleParsed);
    const humanizerLocales = humanizeDuration.getSupportedLanguages();
    let totalErrors = 0;

    // Checks for localeMap.ts
    {
        // Check if any locale on localeMap.ts is either not imported or mapped
        const { mappedImports, mappedLocales } = getMappedLocales();
        const unmappedLocales = xor(mappedImports, mappedLocales);
        for (const locale of unmappedLocales) {
            totalErrors++;
            console.log(chalk.yellow(`[${locale}] is not correctly mapped on localeMap.ts`));
        }

        // Check if any loaded locale is not on localeMap.ts
        const loadedLocalesNames = loadedLocales.map((l) => l.name.replace('.json', ''));
        const unmappedLoadedLocales = xor(loadedLocalesNames, mappedLocales);
        for (const locale of unmappedLoadedLocales) {
            if (locale === 'custom' || locale === 'en') continue;
            totalErrors++;
            console.log(chalk.yellow(`[${locale}] is not mapped on localeMap.ts or not on locales folder`));
        }

        // Check if both localeMap.ts imports and maps are alphabetically sorted
        const sortedMappedImports = [...mappedImports].sort();
        if (JSON.stringify(sortedMappedImports) !== JSON.stringify(mappedImports)) {
            totalErrors++;
            console.log(chalk.yellow(`localeMap.ts imports are not alphabetically sorted`));
        }
        const sortedMappedLocales = [...mappedLocales].sort();
        if (JSON.stringify(sortedMappedLocales) !== JSON.stringify(mappedLocales)) {
            totalErrors++;
            console.log(chalk.yellow(`localeMap.ts mappings are not alphabetically sorted`));
        }
    }

    // For each locale
    for (const { name, raw, data } of loadedLocales) {
        try {
            const parsedLocale = parseLocale(data);
            const parsedLocaleKeys = Object.keys(parsedLocale);
            const errorsFound = [];

            // Checking humanizer-duration key
            if (!humanizerLocales.includes(data.$meta.humanizer_language)) {
                errorsFound.push(['$meta.humanizer_language', 'language not supported']);
            }

            // Checking keys
            const diffKeys = xor(defaultLocaleKeys, parsedLocaleKeys);
            for (const key of diffKeys) {
                const errorType = (defaultLocaleKeys.includes(key)) ? 'missing' : 'excess';
                errorsFound.push([key, `${errorType} key`]);
            }

            // Skip the rest of the checks if there are missing/excess keys
            if (!diffKeys.length) {
                // Checking specials (placeholders or smart time division)
                for (const key of defaultLocaleKeys) {
                    const missing = difference(defaultLocaleParsed[key].specials, parsedLocale[key].specials);
                    if (missing.length) {
                        errorsFound.push([key, `must contain the placeholders ${missing.join(', ')}`]);
                    }
                    const excess = difference(parsedLocale[key].specials, defaultLocaleParsed[key].specials);
                    if (excess.length) {
                        errorsFound.push([key, `contain unknown placeholders: ${excess.join(', ')}`]);
                    }
                }

                // Check for untrimmed strings
                const keysWithUntrimmedStrings = parsedLocaleKeys.filter((k) => {
                    return parsedLocale[k].value !== parsedLocale[k].value.trim();
                });
                for (const key of keysWithUntrimmedStrings) {
                    errorsFound.push([key, `untrimmed string`]);
                }

                // Checking empty strings
                const keysWithEmptyStrings = parsedLocaleKeys.filter((k) => {
                    return parsedLocale[k].value === '';
                });
                for (const key of keysWithEmptyStrings) {
                    errorsFound.push([key, `empty string`]);
                }
            }

            // Check if raw file is formatted correctly
            const rawLinesNormalized = raw.split(/\r?\n/ug).map((l) => l.replace(/\r?\n$/, '\n'));
            const correctFormatting = JSON.stringify(data, null, 4) + '\n';
            const correctLines = correctFormatting.split(/\n/ug);
            if (rawLinesNormalized.at(-1).length) {
                errorsFound.push(['file', 'is not formatted correctly (must end with a newline)']);
            } else if (rawLinesNormalized.length !== correctLines.length) {
                errorsFound.push(['file', 'is not formatted correctly (line count)']);
            } else {
                for (let i = 0; i < rawLinesNormalized.length; i++) {
                    const rawIndentSize = rawLinesNormalized[i].search(/\S/);
                    const correctIndentSize = correctLines[i].search(/\S/);
                    if (rawIndentSize === -1 ^ correctIndentSize === -1) {
                        errorsFound.push([`line ${i + 1}`, 'empty line']);
                        break;
                    }
                    if (rawIndentSize !== correctIndentSize) {
                        errorsFound.push([`line ${i + 1}`, `has wrong indentation (expected ${correctIndentSize} spaces)`]);
                        break;
                    }
                    if (rawLinesNormalized[i].endsWith(' ')) {
                        errorsFound.push([`line ${i + 1}`, 'has trailing whitespace']);
                        break;
                    }
                }
            }

            // Print errors
            totalErrors += errorsFound.length;
            if (errorsFound.length) {
                console.log(chalk.yellow(`[${name}] Errors found in ${data.$meta.label} locale:`));
                console.log(errorsFound.map(x => `- ${x[0]}: ${x[1]}`).join('\n'));
                console.log('');
            }
        } catch (error) {
            totalErrors++;
            console.log(chalk.yellow(`[${name}] ${error.message}`));
        }
    }

    // Print result
    if (totalErrors) {
        console.log(chalk.red(`Errors found: ${totalErrors}`));
        process.exit(1);
    } else {
        console.log(chalk.green('No errors found!'));
    }
};

/**
 * CLI entrypoint
 */
const command = process.argv[2];
if (command === 'rebase') {
    rebaseCommand();
} else if (command === 'check') {
    checkCommand();
} else if (command === 'processStuff') {
    processStuff();
} else {
    console.log("Usage: 'scripts/locale-utils.js <rebase|check|processStuff>'");
}
