import boxen from 'boxen';
import chalk from 'chalk';
import open from 'open';

import got from '@core/extras/got.js';
import getOsDistro from '@core/extras/getOsDistro.js';
import { convars, txEnv } from '@core/globalData';
import consoleFactory from '@extras/console';
import { addLocalIpAddress } from './isIpAddressLocal';
const console = consoleFactory();


const getIPs = async () => {
    const reqOptions = {
        timeout: { request: 2500 },
    };
    const allOps = await Promise.allSettled([
        // op.value.ip
        // got('https://ip.seeip.org/json', reqOptions).json(), //expired cert?
        got('https://api.ipify.org/?format=json', reqOptions).json(),
        got('https://api.myip.com', reqOptions).json(),

        // op.value.query
        // got(`http://ip-api.com/json/`, reqOptions).json(),
        // got(`https://extreme-ip-lookup.com/json/`, reqOptions).json(), //requires API key
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
        `To be able to access txAdmin from the internet open port ${convars.txAdminPort}`,
        'on your OS Firewall as well as in the hosting company.',
    ];
    const winWorkstationMessage = [
        '[!] Home-hosting fxserver is not recommended [!]',
        'You need to open the fxserver port (usually 30120) on Windows Firewall',
        'and port forward it in your router for other players be able to access it.',
        'We recommend renting a server from ' + chalk.inverse(' https://zap-hosting.com/txAdmin ') + '.',
    ];

    const distro = await getOsDistro();
    return (distro && distro.includes('Linux') || distro.includes('Server'))
        ? serverMessage
        : winWorkstationMessage;
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
            console.warn('The WebServer is taking too long to start.');
        }
    };
    interval = setInterval(check, 150);
});

const awaitMasterPin = new Promise((resolve, reject) => {
    const tickLimit = 100; //if over 15 seconds
    let counter = 0;
    let interval;
    const check = () => {
        counter++;
        if (globals.adminVault && globals.adminVault.admins !== null) {
            clearInterval(interval);
            const pin = (globals.adminVault.admins === false) ? globals.adminVault.addMasterPin : false;
            resolve(pin);
        } else if (counter == tickLimit) {
            clearInterval(interval);
            interval = setInterval(check, 2500);
        } else if (counter > tickLimit) {
            console.warn('The AdminVault is taking too long to start.');
        }
    };
    interval = setInterval(check, 150);
});

const awaitDatabase = new Promise((resolve, reject) => {
    const tickLimit = 100; //if over 15 seconds
    let counter = 0;
    let interval;
    const check = () => {
        counter++;
        if (globals.playerDatabase && globals.playerDatabase.isReady) {
            clearInterval(interval);
            resolve(true);
        } else if (counter == tickLimit) {
            clearInterval(interval);
            interval = setInterval(check, 2500);
        } else if (counter > tickLimit) {
            console.warn('The PlayerDatabase is taking too long to start.');
        }
    };
    interval = setInterval(check, 150);
});


export const printBanner = async () => {
    const [ipRes, msgRes, adminPinRes] = await Promise.allSettled([
        getIPs(),
        getOSMessage(),
        awaitMasterPin,
        awaitHttp,
        awaitDatabase,
    ]);

    //Addresses
    let addrs;
    if (convars.forceInterface == false || convars.forceInterface == '0.0.0.0') {
        addrs = [
            (txEnv.isWindows) ? 'localhost' : 'your-public-ip',
        ];
        if (ipRes.value) {
            addrs.push(ipRes.value);
            addLocalIpAddress(ipRes.value);
        }
    } else {
        addrs = [convars.forceInterface];
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
        ...addrs.map((addr) => chalk.inverse(` http://${addr}:${convars.txAdminPort}/ `)),
        ...adminPinLines,
    ];
    console.multiline(boxen(boxLines.join('\n'), boxOptions), chalk.bgGreen);
    if (convars.forceInterface === false) {
        console.multiline(msgRes.value, chalk.bgBlue);
    }

    //Opening page
    if (txEnv.isWindows && adminPinRes.value) {
        open(`http://localhost:${convars.txAdminPort}/addMaster/pin#${adminPinRes.value}`).catch((e) => {});
    }

    //Starting server
    globals.fxRunner.signalStartReady();
};
