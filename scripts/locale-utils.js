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
 * Creates a prompt for easily using some LLM to translate stuff
 */
const BACKTICKS = '```';
const promptTemplateLines = [
    '# Task',
    '{{task}}',
    null,
    '## English Source String:',
    BACKTICKS,
    '{{source}}',
    BACKTICKS,
    null,
    '## Context',
    '{{context}}',
    null,
    '## Example Result',
    BACKTICKS,
    '# English',
    '{{finalEnglish}}',
    '# Portuguese',
    '{{finalPortuguese}}',
    BACKTICKS,
    null,
    '## Prompt Response Format',
    'The return format for this prompt is a JSON file with the type:',
    BACKTICKS + 'ts',
    '{{responseType}}',
    BACKTICKS,
    null,
    // 'Save the result to #file:{{targetFile}}',
];
const getPromptMarkdown = (replacers) => {
    return promptTemplateLines.map((line) => {
        if (line === null) return '';
        for (let [placeholder, text] of Object.entries(replacers)) {
            if (Array.isArray(text)) {
                text = text.join('\n');
            }
            line = line.replace(`{{${placeholder}}}`, text);
        }
        return line;
    }).join('\n').trim();
};

const taskTranslate = `You have the task of translating one string into all the languages in the #file:./locale-source.json.
- Your translated string must be capitalized and punctuated in the same way as the English source string, like the examples below:
    - \`Hello, World!\` -> \`Bonjour, le monde!\`.
    - \`hello, world\` -> \`bonjour, le monde\`.
- Your translated string should be as short/concise as the English source string.
- Instead of formal language, keep it as informal as the English source string.
- Make sure the verbs are in the correct tense and form.
- Pay attention to the context of the string, and make sure it makes sense in the target language.
- If the string contains placeholders (like \`%{reason}\`), make sure to keep them in the translation.
- Do not translate the \`wrapper\` field, only the \`translation\` field.`;
const taskTranslateResponse = `type PromptResponse = {
    [langCode: string]: {
        language: string;
        translation: string;
    };
}`;

const taskReview = `You have the task of reviewing how one string was translated into multiple languages.
Attached you will find the #file:./locale-translate-result.json, which contains all the translations to be reviewed.
- You must review each translation and provide feedback on the quality of the translation.
- Optionally, you can add a short comment on the review, to be reviewed by a reviewer.
    - For example, if it is impossible to translate one word, you can add a comment explaining why.
    - Do not add comments for every translation, only when there is something important to note.
- The feedback criteria should be based on if the translation:
    - **Verbs are in the correct tense and form.**
    - Is as formal or informal as the English source string.
    - Is capitalized and punctuated in the same way as the English source string.
    - Is as short/concise as the English source string.
    - Keeps the same semantic value (makes sense) in the target language as the source string.
    - Keeps the placeholders (like \`%{reason}\`) in the translation.
    - Makes sense in the context provided.
- The review should be one of the following:
    - \`below-average\`: The translation is really bad and needs to be redone.
    - \`average\`: The translation is okay, does not require changes.
    - \`above-average\`: The translation is really good, no changes needed.`;
const taskReviewResponse = `type PromptResponse = {
    [langCode: string]: {
        language: string;
        translation: string;
        review: 'below-average' | 'average' | 'above-average';
        comment?: string; 
    };
}`;

//FIXME: Edit these two below
const promptSourceString = 'the server needs to be restarted, please reconnect';
const promptPortugueseString = 'o servidor precisa ser reiniciado, por favor conecte novamente';
const promptContext = [
    'This string is going to take place into the placeholder `%{reason}` in the `wrapper` field.',
    'This string is displayed to players on a game server as the reason why the player is being kicked out of the server.',
];

//If wrapper
const promptSourceWrapper = (lang) => lang.kick_messages.everyone;
const promptFinalEnglish = 'All players kicked: {{source}}';
const promptFinalPortuguese = 'Todos os jogadores expulsos: {{portuguese}}';


/*
    Instructions:
    - bun run scripts/locale-utils.js buildGptPrompts
    - Prompt ./locale-translate.prompt.md
        - Attach ./locale-source.json
        - Save the result to ./locale-translate.result.json
    - Prompt ./locale-review.prompt.md
        - Attach ./locale-translate.result.json
        - Save the result to ./locale-review.result.json
    - bun run scripts/locale-utils.js applyGptResults
    - Go through the review and change anything that needs to be changed
    - bun run scripts/locale-utils.js check
*/

/**
 * Creates a prompt for easily using some LLM to translate stuff
 */
const buildGptPrompts = () => {
    console.log(`Making prompt files for ${loadedLocales.length} languages.`);

    //Make prompt files
    const finalEnglish = promptFinalEnglish.replace('{{source}}', promptSourceString);
    const finalPortuguese = promptFinalPortuguese.replace('{{portuguese}}', promptPortugueseString);
    const replacers = {
        source: promptSourceString,
        context: promptContext,
        finalEnglish,
        finalPortuguese,
    };
    const translatePromptMd = getPromptMarkdown({
        ...replacers,
        task: taskTranslate,
        responseType: taskTranslateResponse,
        targetFile: './locale-translate.result.json',
    });
    const reviewPromptMd = getPromptMarkdown({
        ...replacers,
        task: taskReview,
        responseType: taskReviewResponse,
        targetFile: './locale-review.result.json',
    });

    //Saving prompts to the github folder
    // const promptsDir = './.github/prompts';
    const promptsDir = './';
    fs.mkdirSync(promptsDir, { recursive: true });
    fs.writeFileSync(path.join(promptsDir, 'locale-translate.prompt.md'), translatePromptMd);
    fs.writeFileSync(path.join(promptsDir, 'locale-review.prompt.md'), reviewPromptMd);

    //Make JSON source file
    const promptObj = {};
    for (const { name, path, data } of loadedLocales) {
        const [langCode] = name.split('.', 1);
        promptObj[langCode] = {
            language: data.$meta.label,
            wrapper: promptSourceWrapper(data),
            translation: '',
        };
    }
    const out = JSON.stringify(promptObj, null, 2) + '\n';
    fs.writeFileSync('./locale-source.json', out);
    fs.writeFileSync('./locale-translate.result.json', '{\n  "error": "empty"\n}'); //empty file
    fs.writeFileSync('./locale-review.result.json', '{\n  "error": "empty"\n}'); //empty file
    // try { fs.unlinkSync('./locale-translate.result.json'); } catch (error) { }
    // try { fs.unlinkSync('./locale-review.result.json'); } catch (error) { }

    console.log('Prompt files created.');
};


/**
 * Applies the results from the GPT to the locale files
 */
const applyGptResults = () => {
    console.log(`Applying GPT results to ${loadedLocales.length} languages.`);

    // Load the results
    const resultFile = fs.readFileSync('./locale-translate.result.json', 'utf8');
    const results = JSON.parse(resultFile);

    // Load evaluation results
    const reviewsFile = fs.readFileSync('./locale-review.result.json', 'utf8');
    const reviews = JSON.parse(reviewsFile);

    // Print translations with color-coded review
    console.log('\nTranslation Results:');
    console.log('===================\n');
    for (const [langCode, result] of Object.entries(reviews)) {
        const { language, translation, review, comment } = result;

        // Choose color based on review
        const colorMap = {
            'below-average': chalk.redBright,
            'average': chalk.yellowBright,
            'above-average': chalk.greenBright,
        };
        const colorFn = colorMap[review] || chalk.inverse;

        console.group(chalk.inverse(`[${langCode}] ${language}:`));
        console.log(chalk.dim('Result:'), colorFn(translation));
        if (comment) {
            console.log(chalk.dim('Comment:'), chalk.hex('#FF45FF')(comment));
        }
        console.groupEnd();
        console.log('');
    }

    // Apply the results
    for (const [langCode, { translation }] of Object.entries(results)) {
        const locale = loadedLocales.find((l) => l.name.startsWith(`${langCode}.`));
        if (!locale) {
            throw new Error(`Locale not found for ${langCode}`);
        }
        locale.data.restarter.server_unhealthy_kick_reason = translation; //FIXME: change target here
        const out = JSON.stringify(locale.data, null, 4) + '\n';
        fs.writeFileSync(locale.path, out);
    }

    console.log('Applied GPT results.');
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

    for (const { name, path, data } of loadedLocales) {
        // rename
        // data.restarter.boot_timeout = data.restarter.start_timeout;
        // remove
        // data.restarter.start_timeout = undefined;
        // edit
        // data.restarter.crash_detected = 'xxx';

        // Save file - FIXME: commented out just to make sure i don't fuck it up by accident
        // const out = JSON.stringify(data, null, 4) + '\n';
        // fs.writeFileSync(path, out);
        // console.log(`Edited file: ${name}`);
    }
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
if (command === 'check') {
    checkCommand();
} else if (command === 'rebase') {
    rebaseCommand();
} else if (command === 'processStuff') {
    processStuff();
} else if (command === 'buildGptPrompts') {
    buildGptPrompts();
} else if (command === 'applyGptResults') {
    applyGptResults();
} else {
    console.log("Usage: 'scripts/locale-utils.js <check|rebase|processStuff|buildGptPrompts|applyGptResults>'");
}
