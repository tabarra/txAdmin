// CodeMirror fivem-cfg syntax highlight
// Written by Tabarra for https://github.com/tabarra/txAdmin

// Warning blocks start with a `## [!] Some Title [!]` line, and continue
// through the immediately following lines that start with `##`
const warningTitleRule = {
    regex: /(##\s*)(\[!\].*?\[!\])(\s*)$/,
    sol: true,
    token: ['comment line-background-cfg-warning-title-line', 'warning-title', null],
    next: 'warning',
};

CodeMirror.defineSimpleMode('fivem-cfg', {
    // The start state contains the rules that are intially used
    start: [
        warningTitleRule,

        // The regex matches the token, the token property contains the type
        {regex: /(["'])(?:[^\\]|\\.)*?(?:\1|$)/, token: 'string'},

        // Rules are matched in the order in which they appear, so there is
        // no ambiguity between this one and the one above
        {regex: /(?:start|stop|ensure|restart|refresh|exec|quit|set|seta|setr|sets)\b/i, token: 'def'},
        // Server listing metadata convars, which must now be configured in the Cfx Portal
        {regex: /(?:sv_hostname|sv_projectName|sv_projectDesc|tags|locale|banner_detail|banner_connecting|load_server_icon)\b/i, token: 'forbidden'},
        {regex: /(?:endpoint_add_tcp|endpoint_add_udp|sv_authMaxVariance|sv_authMinTrust|sv_endpointPrivacy|sv_licenseKey|sv_master1|sv_maxClients|rcon_password|sv_scriptHookAllowed|gamename|onesync|sv_enforceGameBuild)\b/i, token: 'keyword'},
        {regex: /(?:add_ace|add_principal|remove_ace|remove_principal|test_ace)\b/i, token: 'variable-2'},
        {regex: /steam_webApiKey|mysql_connection_string/i, token: 'atom'},
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

    // The warning block state, any non-`##` line goes back to start
    warning: [
        warningTitleRule,
        {regex: /##.*/, sol: true, token: 'comment line-background-cfg-warning-line'},
        {regex: /(?:)/, next: 'start'},
    ],

    meta: {
        // Blank lines are not tokenized, so they need to end the block here
        blankLine: (state) => {
            if (state.state === 'warning') state.state = 'start';
        },
    },
});
