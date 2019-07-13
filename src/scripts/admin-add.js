//Test environment conditions
const helpers = require('../extras/helpers');
helpers.dependencyChecker();

//Requires
const fs = require('fs');
const readline = require('readline');
const bcrypt = require('bcrypt');
const { promisify } = require('util');
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../extras/console');
cleanTerminal()
const context = 'AdminAddScript';
const printDivider = () =>{log('='.repeat(64), context)};



//================================================================
//=================================================== Setup
//================================================================
//Setting up ReadLine
const rl = readline.createInterface({input: process.stdin, output: process.stdout});
readline.Interface.prototype.question[promisify.custom] = function(prompt) {
    return new Promise(resolve =>
        readline.Interface.prototype.question.call(this, prompt, resolve),
    );
};
readline.Interface.prototype.questionAsync = promisify(
    readline.Interface.prototype.question,
);



//================================================================
//=================================================== Functions
//================================================================
//Print options and get answer
async function askForChoice(question, options, persist){
    //Sanity check
    if(typeof question !== 'string') throw new Error('Expected string for question');
    if(!Array.isArray(options)) throw new Error('Expected array for options');
    if(typeof persist === 'undefined') persist = false;
    if(typeof persist !== 'boolean') throw new Error('Expected boolean for persist');

    //Question loop
    while(true){
        console.log(`> ${question}`);
        for (let i = 0; i < options.length; i++) {
            console.log(`    ${i+1} - ${options[i]}`)
        }

        let resp = await rl.questionAsync('Type answer: ');
        if(/^\d+$/.test(resp) && typeof options[resp-1] !== 'undefined') return options[resp-1];
        if(!persist) return false;
        console.log('Invalid alternative.');
    }
}

//Ask yes/no question
async function askForYN(question, defaultAnswer, persist){
    //Sanity check
    if(typeof question !== 'string') throw new Error('Expected string for question');
    if(typeof defaultAnswer === 'undefined') defaultAnswer = true;
    if(typeof defaultAnswer !== 'boolean') throw new Error('Expected boolean for defaultAnswer');
    if(typeof persist === 'undefined') persist = false;
    if(typeof persist !== 'boolean') throw new Error('Expected boolean for persist');

    //Question loop
    let opts = (defaultAnswer)? 'Y/n' : 'y/N';
    question = `> ${question} (${opts}) `;
    while(true){
        let resp = (await rl.questionAsync(question)).toLowerCase();

        if(resp == ''){
            resp = defaultAnswer;
        }else if(resp === 'y' || resp === 'yes'){
            resp = true;
        }else if(resp === 'n' || resp === 'no'){
            resp = false;
        }else{
            console.log('Invalid alternative.');
            if(persist){
                continue;
            }else{
                return null;
            }
        }

        return resp;
    }
}

//Ask question and get response
async function askForString(question, minLength, persist, regex){
    //Sanity check
    if(typeof question !== 'string') throw new Error('Expected string for question');
    if(typeof minLength === 'undefined') minLength = 0;
    if(typeof minLength !== 'number') throw new Error('Expected number for minLength');
    if(typeof persist === 'undefined') persist = false;
    if(typeof persist !== 'boolean') throw new Error('Expected boolean for persist');
    if(typeof regex === 'undefined') regex = false;
    if(typeof regex !== 'string' && typeof regex !== 'boolean') throw new Error('Expected string or boolean for regex');

    //Question loop
    while(true){
        let resp = await rl.questionAsync(`> ${question} `);
        if(regex !== false){
            regex = new RegExp(regex);
        }

        if(resp.length >= minLength){
            if(regex === false || regex.test(resp)){
                return resp;
            }else{
                console.log(`The username must contain only numbers or letters.`);
                if(persist){
                    continue;
                }else{
                    return null;
                }
            }
        }else{
            console.log(`Minimum length is ${minLength}.`);
            if(persist){
                continue;
            }else{
                return null;
            }
        }

    }
}


//================================================================
//=================================================== Main
//================================================================
log("This script will add an admin to the specified admin file or to 'data/admins.json'.", context);
printDivider();


(async () => {
    //Set filename
    let filePath = 'data/';
    if(!process.argv[2]){
        log("Server config file not set. Using the default 'data/admins.json'", context);
        filePath += 'admins.json';
    }else if(!process.argv[2].endsWith('.json')){
        logError("The file admin file name should end with '.json'", context);
        process.exit();
    }else{
        filePath += process.argv[2];
    }


    //Try to load admin file
    let rawFile = null;
    let admins = null;
    try {
        rawFile = fs.readFileSync(filePath, 'utf8');
    } catch (error) {
        log(`Unnable to load '${filePath}'. The file will be created for you`, context);
        admins = [];
    }


    //Try to load data from the file
    if(admins === null){
        let jsonData = null;
        try {
            jsonData = JSON.parse(rawFile);

            if(!Array.isArray(jsonData)) throw new Error("JSON data is not an array")

            let structureIntegrityTest = !jsonData.some((x) =>{
                if(typeof x.name === 'undefined' || typeof x.name !== 'string') return true;
                if(typeof x.password_hash === 'undefined' || typeof x.password_hash !== 'string') return true;
                if(typeof x.permissions === 'undefined' || !Array.isArray(x.permissions)) return true;
                if(!x.password_hash.startsWith('$2')) return true;
                return false;
            });
            if(!structureIntegrityTest) throw new Error("Invalid data or structure")

            log(`Loaded ${jsonData.length} admins.`, context);
            admins = jsonData;
        } catch (error) {
            logError('Unable to load admins. (Invalid JSON, structure or Data)', context);
            let resp = await askForYN('Do you want to overwrite the file?', false);
            if(resp === false || resp === null){
                logWarn('Aborting', context);
                process.exit();
            }
            admins = [];
        }
    }
    printDivider();


    //Getting new admin
    let login = (await askForString('Type the username for the new admin:', 6, true, '^[a-zA-Z0-9]+$')).toLowerCase();
    let passwd = await askForString('Type the password for the new admin:', 6, true);
    let hash = bcrypt.hashSync(passwd, 5);
    admins.push({
        name: login,
        password_hash: hash,
        permissions: ['all']
    })


    //Write to file
    try {
        fs.writeFileSync(filePath, JSON.stringify(admins, null, 4))
    } catch (error) {
        logError('Failed to write admin file with error:');
        dir(error);
        process.exit();
    }


    logOk(`Admin '${login}' added to '${filePath}'.`, context);
    process.exit();
})();
