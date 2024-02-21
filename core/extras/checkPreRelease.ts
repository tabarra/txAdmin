import humanizeDuration, { Unit } from 'humanize-duration';
import chalk from 'chalk';
import consoleFactory from '@extras/console';
const console = consoleFactory('ATTENTION');


//@ts-ignore esbuild will replace TX_PRERELEASE_EXPIRATION with a string
const PRERELEASE_EXPIRATION = parseInt(TX_PRERELEASE_EXPIRATION)
const humanizeOptions = {
    round: true,
    units: ['d', 'h', 'm'] as Unit[],
};

const printExpirationBanner = (timeUntilExpiration: number) => {
    const timeLeft = humanizeDuration(timeUntilExpiration, humanizeOptions)
    const timeLeftStyled = chalk.inverse(` ${timeLeft} `);
    console.error('This is a pre-release version of txAdmin!');
    console.error('This build is meant to be used by txAdmin beta testers.');
    console.error('txAdmin will automatically shut down when this pre-release expires.');
    console.error(`Time until expiration: ${timeLeftStyled}.`);
    console.error('For more information: https://discord.gg/txAdmin.');
}

const cronCheckExpiration = () => {
    if (isNaN(PRERELEASE_EXPIRATION) || PRERELEASE_EXPIRATION === 0) return;

    const timeUntilExpiration = PRERELEASE_EXPIRATION - Date.now();
    if (timeUntilExpiration < 0) {
        console.error('This pre-release version has expired, please update your txAdmin.');
        console.error('For more information: https://discord.gg/txAdmin.');
        console.error('Bye bye 👋');
        process.exit(400);
    } else if (timeUntilExpiration < 24 * 60 * 60 * 1000) {
        printExpirationBanner(timeUntilExpiration);
    }
}

export default () => {
    if (isNaN(PRERELEASE_EXPIRATION) || PRERELEASE_EXPIRATION === 0) return;

    const timeUntilExpiration = PRERELEASE_EXPIRATION - Date.now();
    if (timeUntilExpiration < 0) {
        console.error('This pre-release version has expired, please update your txAdmin.');
        console.error('For more information: https://discord.gg/txAdmin.');
        process.exit(401);
    }

    //First warning
    printExpirationBanner(timeUntilExpiration);

    //Check every 15 minutes
    setInterval(cronCheckExpiration, 15 * 60 * 1000);
};
