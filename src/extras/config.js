module.exports = {
    monitor: {
        interval: 1000,
        timeout: 1000,
        fxServerPort: 30120
    },
    authenticator: {
        adminsFilePath: 'data/admins.json',
        logPath: 'data/log.txt',
        refreshInterval: 15000
    },
    webServer: {
        port: 3000
    },
    fxServer:{
        serverPath: 'D:/FivemServer/serverZero/',
        cfgPath: 'server_teste.cfg',
        resPath: 'D:/FivemServer/serverZero/data/',
        autostart: true
    }
}