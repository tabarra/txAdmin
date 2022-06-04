// CodeMirror fivem-cfg syntax highlight
// Written by Tabarra for https://github.com/tabarra/txAdmin

CodeMirror.defineSimpleMode('fivem-cfg', {
    // The start state contains the rules that are intially used
    start: [
        // The regex matches the token, the token property contains the type
        {regex: /(["'])(?:[^\\]|\\.)*?(?:\1|$)/, token: 'string'},

        // Rules are matched in the order in which they appear, so there is
        // no ambiguity between this one and the one above
        {regex: /(?:start|stop|ensure|restart|refresh|exec|quit|set|seta|setr|sets)\b/i, token: 'def'},
        {regex: /(?:endpoint_add_tcp|endpoint_add_udp|load_server_icon|sv_authMaxVariance|sv_authMinTrust|sv_endpointPrivacy|sv_hostname|sv_licenseKey|sv_master1|sv_maxClients|rcon_password|sv_scriptHookAllowed|gamename|onesync|sv_enforceGameBuild)\b/i, token: 'keyword'},
        {regex: /(?:add_ace|add_principal|remove_ace|remove_principal|test_ace)\b/i, token: 'variable-2'},
        {regex: /banner_connecting|banner_detail|locale|steam_webApiKey|tags|mysql_connection_string|sv_projectName|sv_projectDesc/i, token: 'atom'},
        {regex: /0x[a-f\d]+|[-+]?(?:\.\d+|\d+\.?\d*)(?:e[-+]?\d+)?/i, token: 'number'},
        {regex: /\/\/.*/, token: 'comment'},
        {regex: /#.*/, token: 'comment'},
        {regex: /\/(?:[^\\]|\\.)*?\//, token: 'variable-3'},

        // A next property will cause the mode to move to a different state
        {regex: /\/\*/, token: 'comment', next: 'comment'},

        {regex: /[a-z$][\w$]*/, token: 'variable'},
    ],

    // The multi-line comment state.
    comment: [
        {regex: /.*?\*\//, token: 'comment', next: 'start'},
        {regex: /.*/, token: 'comment'},
    ],
});
