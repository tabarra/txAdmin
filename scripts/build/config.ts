//Configs for the build script (also used in dev)
export default {
    debouncerInterval: 250,
    preReleaseExpirationDays: 21,
    copy: [
        'README.md',
        'docs/',
        'fxmanifest.lua',
        'entrypoint.js',
        'resource/',
        'web/',
    ],
}
