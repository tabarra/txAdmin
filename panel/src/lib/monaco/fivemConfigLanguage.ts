import * as monaco from 'monaco-editor';

export const LANG = 'fivem-cfg';
export const THEME = {
    light: 'fivem-cfg-theme',
    dark: 'fivem-cfg-theme-dark',
};
export const register = (monacoInstance: typeof monaco) => {
    // Register a new language
    monacoInstance.languages.register({ id: LANG });

    // Add language configuration to enable comment toggling
    monacoInstance.languages.setLanguageConfiguration(LANG, {
        comments: {
            lineComment: '#',
        },
        brackets: [
            ['{', '}'],
            ['[', ']'],
            ['(', ')']
        ],
        autoClosingPairs: [
            { open: '{', close: '}' },
            { open: '[', close: ']' },
            { open: '(', close: ')' },
            { open: '"', close: '"' },
        ],
    });

    //NOTE: exported by getting registered commands, then separating the ones that have arity 0&1
    const wellKnownConvars = /\b(adhesive_cdnKey|buildNumber|citizen_dir|con_disableNonTTYReads|gametype|mapname|net_tcpConnLimit|netlib|netPort|onesync|onesync_automaticResend|onesync_distanceCulling|onesync_distanceCullVehicles|onesync_enableBeyond|onesync_enabled|onesync_enableInfinity|onesync_forceMigration|onesync_logFile|onesync_population|onesync_radiusFrequency|onesync_workaround763185|quit|rateLimiter_http_info_burst|rateLimiter_http_info_rate|rateLimiter_http_runcode_burst|rateLimiter_http_runcode_rate|rcon_password|resources_useSystemChat|steam_webApiDomain|steam_webApiKey|sv_authMaxVariance|sv_authMinTrust|sv_disableClientReplays|sv_enableNetEventReassembly|sv_enableNetworkedPhoneExplosions|sv_enableNetworkedScriptEntityStates|sv_enableNetworkedSounds|sv_endpointPrivacy|sv_endpoints|sv_enforceGameBuild|sv_enhancedHostSupport|sv_entityLockdown|sv_experimentalNetEventReassemblyHandler|sv_experimentalNetGameEventHandler|sv_experimentalOneSyncPopulation|sv_experimentalStateBagsHandler|sv_exposePlayerIdentifiersInHttpEndpoint|sv_filterRequestControl|sv_filterRequestControlSettleTimer|sv_forceIndirectListing|sv_hostname|sv_httpFileServerProxyOnly|sv_icon|sv_infoVersion|sv_kick_players_cnl|sv_kick_players_cnl_consecutive_failures|sv_kick_players_cnl_timeout_sec|sv_kick_players_cnl_update_rate_sec|sv_kick_players_cnl_verbose|sv_lan|sv_licenseKey|sv_licenseKeyToken|sv_listingHostOverride|sv_listingIpOverride|sv_master1|sv_master2|sv_master3|sv_maxClientEndpointRequestSize|sv_maxClients|sv_netEventReassemblyMaxPendingEvents|sv_netEventReassemblyUnlimitedPendingEvents|sv_netHttp2|sv_playersToken|sv_poolSizesIncrease|sv_profileDataToken|sv_projectDesc|sv_projectName|sv_prometheusBasicAuthPassword|sv_prometheusBasicAuthUser|sv_pure_verify_client_settings|sv_pure_verify_client_settings_timeout_sec|sv_pureLevel|sv_registerMulticastDns|sv_replaceExeToSwitchBuilds|sv_requestParanoia|sv_scriptHookAllowed|sv_stateBagStrictMode|sv_tcpConnectionTimeoutSeconds|sv_tebexSecret|sv_threadedClientHttp|sv_useAccurateSends|svgui_disable|version|web_baseUrl)\b/i;

    // Register a tokens provider for the language
    monacoInstance.languages.setMonarchTokensProvider(LANG, {
        tokenizer: {
            root: [
                // Comments
                [/#.*$/, 'comment'],
                [/\/\/.*$/, 'comment'],

                //Known convars
                [wellKnownConvars, 'keyword.convar'],

                // Known setter commands get special highlighting
                [/(?:(^\s*|;\s*))(set|seta|setr|sets)\b/, 'keyword.command.setter'],

                //Resource commands
                [/^(?:\s*)(start|stop|ensure|restart)\b/, 'keyword.command.resource'],

                //Executing externals
                [/^(?:\s*)(exec) ([^\s;#"]+)/, 'keyword.command.exec'],

                // Commands (the first word in a line)
                [/^(?:\s*)([a-zA-Z_$][\w$]*)/, 'keyword'],

                // Quoted string
                [/"/, 'string', '@string'],

                // Numbers
                [/\b\d+\b/, 'number'],

                // Default for other tokens (arguments)
                // [/[^\s;"]+/, 'variable'],
            ],

            resources: [
                [/\[[^\s;#"\]]+\]/, { token: 'resource.group', next: '@pop' }],
                [/[^\s;#"]+/, { token: 'resource.name', next: '@pop' }],
                [/$/, { token: '', next: '@pop' }],
            ],

            string: [
                [/[^\\"]+/, 'string'],
                [/\\(?![\\"])/, 'string'],
                [/\\[\\"]/, 'string.escape'],
                [/"/, 'string', '@pop']
            ]
        }
    });

    // Define a new theme that matches the colors we want
    // FIXME:NC need to make the light theme as well
    monacoInstance.editor.defineTheme(THEME.dark, {
        base: 'vs-dark',
        inherit: true,
        rules: [
            // FIXME:NC check these colors
            { token: 'comment', foreground: '608B4E' },
            { token: 'delimiter', foreground: 'C586C0' },
            { token: 'keyword', foreground: '569CD6', fontStyle: 'bold' },
            { token: 'number', foreground: 'B5CEA8' },
            { token: 'string.escape', foreground: 'D7BA7D' },
            { token: 'string', foreground: 'CE9178' },
            { token: 'variable', foreground: 'DCDCAA' },

            //custom
            { token: 'keyword.command.exec', foreground: 'FFC168' },
            { token: 'keyword.command.resource', foreground: '569CD6', fontStyle: 'bold' },
            { token: 'keyword.command.setter', foreground: 'A864D3', fontStyle: 'bold' },
            { token: 'keyword.convar', foreground: 'DCDCAA' },
            { token: 'resource.group', foreground: 'DCDCAA', fontStyle: 'bold' },
            { token: 'resource.name' },
        ],
        colors: {}
    });
};
