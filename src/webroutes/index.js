exports.actionLog = require('./actionLog.js');
exports.downFXServerLog = require('./downFXServerLog.js');
exports.addExtension = require('./addExtension.js');
exports.dashboard = require('./dashboard.js');
exports.getPlayerData = require('./getPlayerData.js');
exports.resources = require('./resources.js');
exports.intercom = require('./intercom.js');
exports.liveConsole = require('./liveConsole.js');
exports.serverLog = require('./serverLog.js');
exports.status = require('./status.js');

exports.auth = {
    get: require('./authentication/get'),
    verify: require('./authentication/verify'),
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

exports.diagnostics = {
    get: require('./diagnostics'),
    getLog: require('./diagnostics-log'),
}

exports.settings = {
    get: require('./settings/get'),
    save: require('./settings/save'),
}

exports.fxserver = {
    commands: require('./fxserver/commands'),
    controls: require('./fxserver/controls'),
}

exports.experiments = {
    bans: {
        get: require('./experiments/bans/get'),
        actions: require('./experiments/bans/actions'),
    }
}
