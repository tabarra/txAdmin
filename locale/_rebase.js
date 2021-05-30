const fs = require('fs');
const path = require('path');
const defaultsDeep = require('lodash/defaultsDeep');
const defaultLang = require('./en.json');

const langFiles = fs.readdirSync(__dirname, { withFileTypes: true })
    .filter((dirent) => !dirent.isDirectory() && dirent.name.endsWith('.json'))
    .map((dirent) => dirent.name);

console.log('Rebasing language files on \'en.json\' for missing keys');
langFiles.forEach((fName) => {
    const fPath = path.join(__dirname, fName);
    const target = JSON.parse(fs.readFileSync(fPath, 'utf8'));
    // target.nui_menu = undefined;
    const synced = defaultsDeep(target, defaultLang);
    const out = JSON.stringify(synced, null, 4) + '\n';
    fs.writeFileSync(fPath, out);
    console.log(`Edited file: ${fName}`);
});
console.log(`Process finished: ${langFiles.length} files.`);
