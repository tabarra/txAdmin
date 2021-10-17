const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { defaults, defaultsDeep, xor } = require('lodash');

//Prepping
const defaultLang = require('./en.json');
const langFiles = fs.readdirSync(__dirname, { withFileTypes: true })
    .filter((dirent) => !dirent.isDirectory() && dirent.name.endsWith('.json') && dirent.name !== 'en.json')
    .map((dirent) => dirent.name);
const langs = langFiles.map((fName) => {
    const fPath = path.join(__dirname, fName);
    return {
        name: fName,
        path: fPath,
        data: JSON.parse(fs.readFileSync(fPath, 'utf8')),
    };
});


/**
 * Adds missing tags to files based on en.json
 */
const rebaseCommand = () => {
    console.log('Rebasing language files on \'en.json\' for missing keys');
    langs.forEach(({name, path, data}) => {
        const synced = defaultsDeep(data, defaultLang);
        //synced.nui_menu = undefined;
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

    let errors = 0;
    langs.forEach(({name, data}) => {
        const parsed = parseLocale(data);

        //Testing keys
        const diffKeys = xor(Object.keys(defaultLangParsed), Object.keys(parsed));
        if (diffKeys.length) {
            console.log(`${chalk.yellow(name)}\tKeys validation failed on: ${diffKeys.join(', ')}`);
            errors += diffKeys.length;
        }

        //Testing strings
        const diffSpecials = Object.keys(defaultLangParsed).filter((k) => {
            return xor(defaultLangParsed[k], parsed[k]).length;
        });
        if (diffSpecials.length) {
            console.log(`${chalk.yellow(name)}\tString specials validation failed on: ${diffSpecials.join(', ')}`);
            errors += diffSpecials.length;
        }
    });

    //Print result
    if (errors) {
        console.log(chalk.red(`Errors found: ${errors}`));
    } else {
        console.log(chalk.green('No errors found!'));
    }
};


/**
 *
 */
const command = process.argv[2];
if (command === 'rebase') {
    rebaseCommand();
} else if (command === 'diff') {
    diffCommand();
} else {
    console.log('Usage: \'node locale/_utils.json <rebase|diff>\'');
}
