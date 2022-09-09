export default {
    fxserverPath: 'E:\\FiveM\\BUILDS\\5848\\fxserver.exe',
    debouncerInterval: 250,
    preReleaseExpirationDays: 21,
    txAdminArgs: [
        '+set', 'txAdminDevMode', 'true',
        // '+set', 'txAdminVerbose', 'true',

        //FIXME: broken
        // '+set', 'txDebugPlayerlistGenerator', 'true',
        // '+set', 'txDebugExternalSource', 'xxxxxxxx:30120',
    ],
    copy: [
        'README.md',
        'LICENSE',
        'docs/',
        'fxmanifest.lua',
        'entrypoint.js',
        'resource/',
        'web/',
    ],
}
