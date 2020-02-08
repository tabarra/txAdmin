//Requires
const modulename = 'HashLocale';
const fs = require('fs-extra');
const crypto  = require('crypto');
const { dir, log, logOk, logWarn, logError, cleanTerminal} = require('../extras/console')(modulename);
cleanTerminal()


(async()=>{
    let localeFolder = './locale/';
    var langFiles = await fs.readdir(localeFolder);
    let hashes = [];
    let options = [];
    langFiles.forEach((fileName)=>{
        let lang = fileName.replace(/\.json/g, '');
        if(lang === 'custom') return;
        let hash;
        let label;
        try {
            let raw = fs.readFileSync(`${localeFolder}/${lang}.json`, 'utf8');
            let langData = JSON.parse(raw);
            let toHash = JSON.stringify(langData);
            hash = crypto.createHash('SHA1').update(toHash).digest("hex");
            label = (typeof langData['$meta'].label !== 'undefined')? langData['$meta'].label: fileName;
            hashes.push(`${lang}: '${hash}', //${label}`);
            options.push(`<option value="${lang}" {{global.language=='${lang}'|isSelected}}>${label}</option>`);
        } catch (error) {
            logError(`Couldn't hash file ${fileName}`);
            dir(error)
        }
    });

    log('Locale hashes:');
    console.log(hashes.join("\n"));
    log('Locale options:');
    console.log(options.join("\n"));
})();
