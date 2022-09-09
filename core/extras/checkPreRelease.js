import humanizeDuration from 'humanize-duration';
import chalk from 'chalk';

const printWarning = (msg) => {
    console.log(chalk.bold.bgRedBright(`[txAdmin] ATTENTION!`) + ' ' + msg);
}

const humanizeOptions = {
    round: true,
    units: ['d', 'h', 'm'],
};

const printExpirationBanner = (timeUntilExpiration) => {
    const timeLeft = humanizeDuration(timeUntilExpiration, humanizeOptions)
    const timeLeftStyled = chalk.inverse(` ${timeLeft} `);
    printWarning('This is a pre-release version of txAdmin!');
    printWarning('This build is meant to be used by txAdmin beta testers.');
    printWarning('txAdmin will automatically shut down when this pre-release expires.');
    printWarning(`Time until expiration: ${timeLeftStyled}.`);
    printWarning('For more information: https://discord.gg/txAdmin.');
}

const cronCheckExpiration = () => {
    const timeUntilExpiration = TX_PRERELEASE_BUILD_EXPIRATION - Date.now();
    if (timeUntilExpiration < 0) {
        printWarning('This pre-release version has expired, please update your txAdmin.');
        printWarning('For more information: https://discord.gg/txAdmin.');
        process.exit(1);
    } else if(timeUntilExpiration < 24 * 60 * 60 * 1000){
        printExpirationBanner(timeUntilExpiration);
    }
}

export default () => {
    if (typeof TX_PRERELEASE_BUILD_EXPIRATION !== 'number') return;
    const timeUntilExpiration = TX_PRERELEASE_BUILD_EXPIRATION - Date.now();
    if (timeUntilExpiration < 0) {
        printWarning('This pre-release version has expired, please update your txAdmin.');
        process.exit(1);
    }

    //First warning
    printExpirationBanner(timeUntilExpiration);

    //Check every 15 minutes
    setInterval(cronCheckExpiration, 15 * 60 * 1000);
};
