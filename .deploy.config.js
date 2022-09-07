export default {
    fxserverPath: 'E:\\FiveM\\BUILDS\\5834\\fxserver.exe',
    debouncerInterval: 250,
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
