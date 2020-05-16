exports.dashboard = require('./dashboard.js');
exports.diagnostics = require('./diagnostics.js');
exports.intercom = require('./intercom.js');
exports.liveConsole = require('./liveConsole.js');
exports.resources = require('./resources.js');
exports.serverLog = require('./serverLog.js');
exports.status = require('./status.js');
exports.txAdminLog = require('./txAdminLog.js');

exports.auth = {
    get: require('./authentication/get'),
    addMaster: require('./authentication/addMaster'),
    providerRedirect: require('./authentication/providerRedirect'),
    providerCallback: require('./authentication/providerCallback'),
    verifyPassword: require('./authentication/verifyPassword'),
    changePassword: require('./authentication/changePassword'),
}

exports.adminManager = {
    get: require('./adminManager/get'),
    actions: require('./adminManager/actions'),
}

exports.cfgEditor = {
    get: require('./cfgEditor/get'),
    save: require('./cfgEditor/save'),
}

exports.settings = {
    get: require('./settings/get'),
    save: require('./settings/save'),
}

exports.setup = {
    get: require('./setup/get'),
    post: require('./setup/post'),
}

exports.fxserver = {
    commands: require('./fxserver/commands'),
    controls: require('./fxserver/controls'),
    downloadLog: require('./fxserver/downloadLog'),
}

exports.player = {
    list: require('./player/list'),
    modal: require('./player/modal'),
    actions: require('./player/actions'),
}

exports.advanced = {
    get: require('./advanced/get'),
    actions: require('./advanced/actions'),
}


//FIXME: remove
exports.experiments = {
    bans: {
        get: require('./experiments/bans/get'),
        actions: require('./experiments/bans/actions'),
    }
}
