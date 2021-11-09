exports.dashboard = require('./dashboard.js');
exports.diagnostics = require('./diagnostics.js');
exports.intercom = require('./intercom.js');
exports.liveConsole = require('./liveConsole.js');
exports.resources = require('./resources.js');
exports.status = require('./status.js');
exports.chartData = require('./chartData.js');
exports.txAdminLog = require('./txAdminLog.js');

exports.auth = {
    get: require('./authentication/get'),
    addMaster: require('./authentication/addMaster'),
    providerRedirect: require('./authentication/providerRedirect'),
    providerCallback: require('./authentication/providerCallback'),
    verifyZapToken: require('./authentication/verifyZapToken'),
    verifyPassword: require('./authentication/verifyPassword'),
    changePassword: require('./authentication/changePassword'),
    nui: require('./authentication/nui'),
};

exports.adminManager = {
    get: require('./adminManager/get'),
    actions: require('./adminManager/actions'),
};

exports.cfgEditor = {
    get: require('./cfgEditor/get'),
    save: require('./cfgEditor/save'),
};

exports.deployer = {
    stepper: require('./deployer/stepper'),
    status: require('./deployer/status'),
    actions: require('./deployer/actions'),
};

exports.settings = {
    get: require('./settings/get'),
    save: require('./settings/save'),
};

exports.masterActions = {
    get: require('./masterActions/get'),
    getBackup: require('./masterActions/getBackup'),
    actions: require('./masterActions/actions'),
};

exports.setup = {
    get: require('./setup/get'),
    post: require('./setup/post'),
};

exports.fxserver = {
    commands: require('./fxserver/commands'),
    controls: require('./fxserver/controls'),
    downloadLog: require('./fxserver/downloadLog'),
};

//FIXME: reorganizar TODAS rotas de logs, incluindo listagem e download
exports.serverLog = require('./serverLog.js');
exports.serverLogPartial = require('./serverLogPartial.js');

exports.player = {
    list: require('./player/list'),
    modal: require('./player/modal'),
    actions: require('./player/actions'),
};

exports.advanced = {
    get: require('./advanced/get'),
    actions: require('./advanced/actions'),
};
