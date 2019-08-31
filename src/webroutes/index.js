exports.downloadLog = require('./downloadLog.js');
exports.fxCommands = require('./fxCommands.js');
exports.fxControls = require('./fxControls.js');
exports.getActionLog = require('./getActionLog.js');
exports.getAddExtension = require('./getAddExtension.js');
exports.getConsole = require('./getConsole.js');
exports.getDashboard = require('./getDashboard.js');
exports.getFullReport = require('./getFullReport.js');
exports.getPlayerData = require('./getPlayerData.js');
exports.getResources = require('./getResources.js');
exports.getServerLog = require('./getServerLog.js');
exports.getSettings = require('./getSettings.js');
exports.getStatus = require('./getStatus.js');
exports.intercom = require('./intercom.js');
exports.saveSettings = require('./saveSettings.js');

exports.auth = {
    get: require('./authentication/get'),
    verify: require('./authentication/verify'),
    changePassword: require('./authentication/changePassword'),
}

exports.adminManager = {
    get: require('./adminManager/get'),
    actions: require('./adminManager/actions'),
}
