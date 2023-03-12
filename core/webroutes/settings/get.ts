const modulename = 'WebServer:SettingsGet';
import { cloneDeep }  from 'lodash-es';
import { convars, txEnv } from '@core/globalData';
import localeMap from '@shared/localeMap';
import { redactApiKeys } from '../../extras/helpers';
import { defaultEmbedConfigJson, defaultEmbedJson } from '@core/components/DiscordBot/defaultJsons';
import consoleFactory from '@extras/console';
const console = consoleFactory(modulename);


/**
 * Returns the output page containing the live console
 * @param {object} ctx
 */
export default async function SettingsGet(ctx) {
    //Check permissions
    if (!ctx.utils.hasPermission('settings.view')) {
        return ctx.utils.render('main/message', {message: 'You don\'t have permission to view this page.'});
    }

    const locales = Object.keys(localeMap).map(code => {
        return { code, label: localeMap[code].$meta.label };
    });
    locales.push({ code: 'custom', label: 'Custom (txData/locale.json)' });

    const renderData = {
        headerTitle: 'Settings',
        locales,
        global: cleanRenderData(globals.configVault.getScopedStructure('global')),
        fxserver: cleanRenderData(globals.configVault.getScopedStructure('fxRunner')),
        playerDatabase: cleanRenderData(globals.configVault.getScopedStructure('playerDatabase')),
        monitor: cleanRenderData(globals.configVault.getScopedStructure('monitor')),
        discord: cleanRenderData(globals.configVault.getScopedStructure('discordBot')),
        readOnly: !ctx.utils.hasPermission('settings.write'),
        serverTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        activeTab: 'global',
        isZapHosting: convars.isZapHosting,
        txDataPath: txEnv.dataPath,
        defaults: {
            discord: {
                embedJson: defaultEmbedJson,
                embedConfigJson: defaultEmbedConfigJson,
            }
        }
    };

    if (renderData.readOnly) {
        renderData.fxserver.commandLine = redactApiKeys(renderData.fxserver.commandLine);
    }

    return ctx.utils.render('main/settings', renderData);
};


//================================================================
function cleanRenderData(inputData: object) {
    const input = cloneDeep(inputData);

    const processValue = (inputValue: any): any => {
        if (inputValue === null || inputValue === false || typeof inputValue === 'undefined') {
            return '';
        } else if (inputValue === true) {
            return 'checked';
        } else if (Array.isArray(inputValue)) {
            return inputValue.join(', ');
        } else if (typeof inputValue === 'object') {
            return cleanRenderData(inputValue);
        } else {
            return inputValue;
        }
    }

    //Prepare output object
    const out: any = {};
    for (const [key, value] of Object.entries(input)) {
        const processed = processValue(value);
        out[key] = processed;
    }
    return out;
}
