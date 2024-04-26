export default {
    debouncerInterval: 250,
    preReleaseExpirationDays: 21,

    //NOTE: to test the panel from LAN, change localhost to your LAN IP
    //but the NUI will not work due to HTTPS->HTTP restrictions
    panelViteUrl: 'http://localhost:40122',
    // panelViteUrl: 'http://192.168.0.39:40122',

    txAdminArgs: [
        '+set', 'txAdminDevMode', 'true',
        '+set', 'txAdminVerbose', 'true',
        // '+set', 'txAdminPort', '40125',
        // '--trace-warnings',
        // '--inspect',
        // '--trace-gc',
        // '--max-old-space-size=4096', //doesn't work
        
        //FIXME: broken
        // '+set', 'txDebugPlayerlistGenerator', 'true',
        // '+set', 'txDebugExternalSource', 'xxxxxxxx:30120',
    ],
    copy: [
        'README.md',
        'docs/',
        'fxmanifest.lua',
        'entrypoint.js',
        'resource/',
        'web/',
    ],
}
