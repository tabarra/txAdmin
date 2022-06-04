//Requires
const os = require('os');
const boxen = require('boxen');
const chalk = require('chalk');
const open = require('open');
const { dir, log, logOk, logWarn, logError } = require('./console')();
const got = require('./got');
const windowsReleaseAsync = require('./windowsReleaseAsync');

// const getTimeout = (timeoutLimit) => {
//     let timer;
//     return new Promise((_, reject) => {
//         timer = setTimeout(() => {
//             reject(new Error());
//         }, timeoutLimit);
//     });
// }


const printMultiline = (lines, color) => {
    const prefix = color('[txAdmin]');
    if (!Array.isArray(lines)) lines = lines.split('\n');
    const message = lines.map((line) => `${prefix} ${line}`);
    console.log(message.join('\n'));
};

const getIPs = async () => {
    const reqOptions = {timeout: 2500};
    const allOps = await Promise.allSettled([
        got('https://ip.seeip.org/json', reqOptions).json(),
        got('https://api.ipify.org/?format=json', reqOptions).json(),
        got('https://api.myip.com', reqOptions).json(),
        // Promise.reject()
        // got(`http://ip-api.com/json/`, reqOptions).json(),
        // got(`https://extreme-ip-lookup.com/json/`, reqOptions).json(),
    ]);
    for (let i = 0; i < allOps.length; i++) {
        const op = allOps[i];
        if (op.status == 'fulfilled' && op.value.ip) {
            return op.value.ip;
        }
    }
    return false;
};

const getOSMessage = async () => {
    const serverMessage = [
        `To be able to access txAdmin from the internet open port ${GlobalData.txAdminPort}`,
        'on your OS Firewall as well as in the hosting company.',
    ];
    const winWorkstationMessage = [
        '[!] Home-hosting fxserver is not recommended [!]',
        'You need to open the fxserver port (usually 30120) on Windows Firewall',
        'and port forward it in your router for other players be able to access it.',
        'We recommend renting a server from ' + chalk.inverse(' https://zap-hosting.com/txAdmin ') + '.',
    ];

    if (GlobalData.osType == 'linux') {
        GlobalData.osDistro = os.release();
        return serverMessage;
    } else {
        try {
            const distro = await windowsReleaseAsync();
            GlobalData.osDistro = `Windows ${distro}`;
            return (distro.toLowerCase().includes('server')) ? serverMessage : winWorkstationMessage;
        } catch (error) {
            if (GlobalData.verbose) {
                logWarn(`Failed to detect windows version with error: ${error.message}`);
                dir(error);
            }
            return serverMessage;
        }
    }
};

const awaitHttp = new Promise((resolve, reject) => {
    const tickLimit = 100; //if over 15 seconds
    let counter = 0;
    let interval;
    const check = () => {
        counter++;
        if (globals.webServer && globals.webServer.isListening) {
            clearInterval(interval);
            resolve(true);
        } else if (counter == tickLimit) {
            clearInterval(interval);
            interval = setInterval(check, 2500);
        } else if (counter > tickLimit) {
            logWarn('The webserver is taking too long to start.');
        }
    };
    interval = setInterval(check, 150);
});

const awaitMasterPin = new Promise((resolve, reject) => {
    const interval = setInterval(() => {
        if (globals.adminVault && globals.adminVault.admins !== null) {
            clearInterval(interval);
            const pin = (globals.adminVault.admins === false) ? globals.adminVault.addMasterPin : false;
            resolve(pin);
        }
    }, 150);
});


module.exports.printBanner = async () => {
    const [ ipRes, msgRes, adminPinRes ] = await Promise.allSettled([
        getIPs(),
        getOSMessage(),
        awaitMasterPin,
        awaitHttp,
    ]);

    //Addresses
    let addrs;
    if (GlobalData.forceInterface == false || GlobalData.forceInterface == '0.0.0.0') {
        addrs = [
            (GlobalData.osType === 'linux') ? 'your-public-ip' : 'localhost',
        ];
        if (ipRes.value) {
            addrs.push(ipRes.value);
            GlobalData.loopbackInterfaces.push(ipRes.value);
        }
    } else {
        addrs = [GlobalData.forceInterface];
    }

    //Admin PIN
    let adminPinLines = [];
    if (adminPinRes.value) {
        adminPinLines = [
            '', 'Use the PIN below to register:',
            chalk.inverse(` ${adminPinRes.value} `),
        ];
    }

    //Printing stuff
    const boxOptions = {
        padding: 1,
        margin: 1,
        align: 'center',
        borderStyle: 'bold',
        borderColor: 'cyan',
    };
    const boxLines = [
        'All ready! Please access:',
        ...addrs.map((addr) => chalk.inverse(` http://${addr}:${GlobalData.txAdminPort}/ `)),
        ...adminPinLines,
    ];
    printMultiline(boxen(boxLines.join('\n'), boxOptions), chalk.bold.bgGreen);
    if (GlobalData.forceInterface == false) {
        printMultiline(msgRes.value, chalk.bold.bgBlue);
    }

    //Opening page
    if (GlobalData.osType === 'windows' && adminPinRes.value) {
        open(`http://localhost:${GlobalData.txAdminPort}/auth#${adminPinRes.value}`).catch();
    }

    //Starting server
    globals.fxRunner.signalStartReady();
};
