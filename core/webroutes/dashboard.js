const modulename = 'WebServer:Dashboard';
import consoleFactory from '@extras/console';
const console = consoleFactory(modulename);

/**
 * Returns the output page containing the Dashboard (index)
 * @param {object} ctx
 */
export default async function Dashboard(ctx) {
    // Check if the deployer is running or setup is pending
    if (globals.deployer !== null) {
        return ctx.utils.legacyNavigateToPage('/server/deployer');
    }
    if (!globals.fxRunner.config.serverDataPath || !globals.fxRunner.config.cfgPath) {
        return ctx.utils.legacyNavigateToPage('/server/setup');
    }

    //Shortcut function
    const getPermDisable = (perm) => {
        return (ctx.admin.hasPermission(perm)) ? '' : 'disabled';
    };

    //Preparing render data
    const renderData = {
        headerTitle: 'Dashboard',
        discordEvent: false,
        serverTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        // discordEvent: {
        //     timestamp: 1645512230000,
        //     time: '45 minutes',
        //     isLive: false,
        //     time: '15 minutes ago',
        //     isLive: true,
        //     description: 'Release of txAdmin v4.14.0 - What\'s New - How to Update - Feature Voting - Giveaway',
        //     joinLink: 'https://discord.gg/2KpVQX665M',
        //     imgSrc: 'https://discordapp.com/api/guilds/577993482761928734/widget.png?style=shield',
        // },
        perms: {
            commandMessage: getPermDisable('players.message'),
            commandKick: getPermDisable('players.kick'),
            commandResources: getPermDisable('commands.resources'),
            controls: getPermDisable('control.server'),
            controlsClass: (ctx.admin.hasPermission('control.server')) ? 'danger' : 'secondary',
        },
    };


    //Rendering the page
    return ctx.utils.render('main/dashboard', renderData);
};
