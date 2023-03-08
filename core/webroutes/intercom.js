const modulename = 'WebServer:Intercom';
import { cloneDeep }  from 'lodash-es';
import logger from '@core/extras/console.js';
import { convars, txEnv } from '@core/globalData';
const { dir, log, logOk, logWarn, logError } = logger(modulename);

//Helper functions
const isUndefined = (x) => { return (typeof x === 'undefined'); };


/**
 * Intercommunications endpoint
 * @param {object} ctx
 */
export default async function Intercom(ctx) {
    //Sanity check
    if (isUndefined(ctx.params.scope)) {
        return ctx.utils.error(400, 'Invalid Request');
    }
    const scope = ctx.params.scope;

    const postData = cloneDeep(ctx.request.body);
    postData.txAdminToken = true;

    //Delegate to the specific scope functions
    if (scope == 'monitor') {
        try {
            globals.healthMonitor.handleHeartBeat('http', postData);
            const extractData = {
                //FIXME: mover isso pro stats collector, calcular a cada 5 mins, add hardware, recipe, ptero, etc
                //Changelog:
                // 6: added txStatsData.randIDFailures
                // 7: changed web folder paths, which affect txStatsData.pageViews
                // 8: removed discordBotStats and whitelistEnabled
                '$statsVersion': 8,
                isZapHosting: convars.isZapHosting,
                txAdminVersion: txEnv.txAdminVersion,
                txAdminIsDefaultPort: (convars.txAdminPort == 40120),
                txAdminUptime: Math.round(process.uptime()),
                fxServerUptime: globals.fxRunner.getUptime(),
                // discordBotStats: (globals.discordBot.config.enabled) ? globals.discordBot.usageStats : false, //FIXME:
                banlistEnabled: globals.playerDatabase.config.onJoinCheckBan,
                // whitelistEnabled: globals.playerDatabase.config.onJoinCheckWhitelist, //FIXME: false / string with options > whitelistMode
                admins: (globals.adminVault.admins) ? globals.adminVault.admins.length : 1,
                tmpLooksLikeRecipe: (globals.fxRunner.config.serverDataPath || '').includes('.base'),
            };
            //NOTE: txStatsData.playerDBStats is cheap-ish to get sync from playerDatabase.getDatabaseStats()
            const outData = Object.assign(extractData, globals.databus.txStatsData);
            return ctx.send(JSON.stringify(outData, null, 2));
        } catch (error) {
            return ctx.send({
                txAdminVersion: txEnv.txAdminVersion,
                success: false,
            });
        }
    } else if (scope == 'resources') {
        if (!Array.isArray(postData.resources)) {
            return ctx.utils.error(400, 'Invalid Request');
        }
        globals.databus.resourcesList = {
            timestamp: new Date(),
            data: postData.resources,
        };
    } else {
        return ctx.send({
            type: 'danger',
            message: 'Unknown intercom scope.',
        });
    }

    return ctx.send({
        txAdminVersion: txEnv.txAdminVersion,
        success: false,
    });
};
