import fs from 'node:fs';
import path from 'node:path';
import chalk from 'chalk';
import { defaults, defaultsDeep, xor } from 'lodash-es';
import humanizeDuration from 'humanize-duration';

//Prepping
const defaultLang = JSON.parse(fs.readFileSync('./locale/en.json', 'utf8'));
const langFiles = fs.readdirSync('./locale/', { withFileTypes: true })
    .filter((dirent) => !dirent.isDirectory() && dirent.name.endsWith('.json') && dirent.name !== 'en.json')
    .map((dirent) => dirent.name);
const langs = langFiles.map((fName) => {
    const fPath = path.join('./locale/', fName);
    let data;
    try {
        data = JSON.parse(fs.readFileSync(fPath, 'utf8'))
    } catch (error) {
        console.log(chalk.red(`Failed to load ${fName}:`));
        console.log(error.message);
        process.exit(1);
    }
    return {
        name: fName,
        path: fPath,
        data,
    };
});

//Clean en.json
// fs.writeFileSync('./locale/en.json', JSON.stringify(defaultLang, null, 4) + '\n');
// console.log('clean en.json');
// process.exit();

// const customLocale = 'E://FiveM//BUILDS//txData//locale.json';
// langs.push({
//     name: 'custom',
//     path: customLocale,
//     data: JSON.parse(fs.readFileSync(customLocale, 'utf8')),
// });


/**
 * Adds missing tags to files based on en.json
 */
const rebaseCommand = () => {
    console.log('Rebasing language files on \'en.json\' for missing keys');
    langs.forEach(({ name, path, data }) => {
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
    });
    console.log(`Process finished: ${langFiles.length} files.`);
};


/**
 * Parses a locale file by "unfolding" it into an object of objects instead of strings
 */
function parseLocale(input, prefix = '') {
    let result = {};
    if (!input) {
        return result;
    }

    Object.keys(input).forEach((key) => {
        const newPrefix = (prefix) ? `${prefix}.` : '';
        if (
            typeof input[key] === 'object'
            && !Array.isArray(input[key])
            && input[key] !== null
        ) {
            const recParse = parseLocale(input[key], `${newPrefix}${key}`);
            result = defaults(result, recParse);
        } else {
            if (typeof input[key] === 'string') {
                const specials = input[key].matchAll(/(%{\w+}|\|\|\|\|)/g);
                result[`${newPrefix}${key}`] = [...specials].map((m) => m[0]);
            } else {
                result[`${newPrefix}${key}`] = null;
            }
        }
    });

    return result;
}

const diffCommand = () => {
    console.log('Diffing language files on \'en.json\' for missing/excess keys, or different special values');
    const defaultLangParsed = parseLocale(defaultLang);
    const humanizerLocales = humanizeDuration.getSupportedLanguages();
    

    let errors = 0;
    langs.forEach(({ name, data }) => {
        const parsed = parseLocale(data);

        //Testing humanizer-duration key
        if(!humanizerLocales.includes(data.$meta.humanizer_language)){
            errors++;
            console.log(chalk.yellow(`[${name}] $meta.humanizer_language not supported.`));
        } 

        //Testing keys
        const diffKeys = xor(Object.keys(defaultLangParsed), Object.keys(parsed));
        if (diffKeys.length) {
            console.log(chalk.yellow(`[${name}] Keys validation failed on:`));
            console.log(diffKeys.map(x => `- ${x}`).join('\n'));
            console.log('');
            errors += diffKeys.length;
        }

        //Testing strings
        const diffSpecials = Object.keys(defaultLangParsed).filter((k) => {
            return xor(defaultLangParsed[k], parsed[k]).length;
        });
        if (diffSpecials.length) {
            console.log(chalk.yellow(`[${name}] String specials validation failed on:`));
            console.log(diffSpecials.map(x => `- ${x}`).join('\n'));
            console.log('');
            errors += diffSpecials.length;
        }
    });

    //Print result
    if (errors) {
        console.log(chalk.red(`Errors found: ${errors}`));
        process.exit(1);
    } else {
        console.log(chalk.green('No errors found!'));
    }
};

const processStuff = () => {
    console.log(defaultLang.nui_menu.page_main.announcement.dialog_desc);
    langs.forEach(({ name, path, data }) => {
        // nui_menu.misc.general_no_perms, nui_menu.misc.action_unauthorized
        // console.log(data.nui_menu.misc.general_no_perms);
        // console.log(data.nui_menu.misc.action_unauthorized);

        //nui_menu.common.error, nui_menu.misc.unknown_error
        // console.log(data.nui_menu.common.error);
        // console.log(data.nui_menu.misc.unknown_error);

        // if (data.nui_menu.page_main.announcement.dialog_desc !== 'Send an announcement to all online players.') {
        //     console.log(chalk.yellow(`>> ${name}`));
        //     console.log(data.nui_menu.page_main.announcement.dialog_desc);
        // }
        // data.nui_menu.page_main.player_ids = {
        //     title: data.nui_menu.page_main.player_ids.title,
        //     label: defaultLang.nui_menu.page_main.player_ids.label,
        //     alert_show: data.nui_menu.page_main.player_ids.alert_show,
        //     alert_hide: data.nui_menu.page_main.player_ids.alert_hide,
        // };
        // data.nui_menu.player_modal.ban.submit = 'Apply ban';
        
        //remove stuff
        // data.whitelist_messages = undefined;

        //Save file - FIXME: commented out just to make sure i don't fuck it up by accident
        // const out = JSON.stringify(data, null, 4) + '\n';
        // fs.writeFileSync(path, out);
        // console.log(`Edited file: ${name}`);
    });
};


/**
 *
 */
const command = process.argv[2];
if (command === 'rebase') {
    rebaseCommand();
} else if (command === 'diff') {
    diffCommand();
} else if (command === 'processStuff') {
    processStuff();
} else {
    console.log('Usage: \'node locale/_utils.json <rebase|diff>\'');
}
