const modulename = 'WebServer:SettingsGet';
import { cloneDeep }  from 'lodash-es';
import logger from '@core/extras/console.js';
import { convars, txEnv } from '@core/globalData.js';
import { redactApiKeys } from '../../extras/helpers';
const { dir, log, logOk, logWarn, logError } = logger(modulename);;


/**
 * Returns the output page containing the live console
 * @param {object} ctx
 */
export default async function SettingsGet(ctx) {
    //Check permissions
    if (!ctx.utils.checkPermission('settings.view', modulename)) {
        return ctx.utils.render('main/message', {message: 'You don\'t have permission to view this page.'});
    }

    const renderData = {
        headerTitle: 'Settings',
        global: cleanRenderData(globals.configVault.getScopedStructure('global')),
        fxserver: cleanRenderData(globals.configVault.getScopedStructure('fxRunner')),
        playerController: cleanRenderData(globals.configVault.getScopedStructure('playerController')),
        monitor: cleanRenderData(globals.configVault.getScopedStructure('monitor')),
        discord: cleanRenderData(globals.configVault.getScopedStructure('discordBot')),
        readOnly: !ctx.utils.checkPermission('settings.write', modulename, false),
        serverTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        activeTab: 'global',
        isZapHosting: convars.isZapHosting,
        txDataPath: txEnv.dataPath,
    };

    if (renderData.readOnly) {
        renderData.fxserver.commandLine = redactApiKeys(renderData.fxserver.commandLine);
    }

    return ctx.utils.render('main/settings', renderData);
};


//================================================================
function cleanRenderData(inputData) {
    const input = cloneDeep(inputData);
    const out = {};
    Object.keys(input).forEach((prop) => {
        if (input[prop] == null || input[prop] === false || typeof input[prop] === 'undefined') {
            out[prop] = '';
        } else if (input[prop] === true) {
            out[prop] = 'checked';
        } else if (input[prop].constructor === Array) {
            out[prop] = input[prop].join(', ');
        } else if (input[prop].constructor === Object) {
            out[prop] = cleanRenderData(input[prop]);
        } else {
            out[prop] = input[prop];
        }
    });
    return out;
}
