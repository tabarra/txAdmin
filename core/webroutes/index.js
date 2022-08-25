export * as dashboard from './dashboard.js';
export * as diagnostics from './diagnostics.js';
export * as intercom from './intercom.js';
export * as liveConsole from './liveConsole.js';
export * as resources from './resources.js';
export * as status from './status.js';
export * as chartData from './chartData.js';
export * as txAdminLog from './txAdminLog.js';

export * as auth_get from './authentication/get';
export * as auth_addMaster from './authentication/addMaster';
export * as auth_providerRedirect from './authentication/providerRedirect';
export * as auth_providerCallback from './authentication/providerCallback';
export * as auth_verifyPassword from './authentication/verifyPassword';
export * as auth_changePassword from './authentication/changePassword';
export * as auth_nui from './authentication/nui';

export * as adminManager_get from './adminManager/get';
export * as adminManager_actions from './adminManager/actions';

export * as cfgEditor_get from './cfgEditor/get';
export * as cfgEditor_save from './cfgEditor/save';

export * as deployer_stepper from './deployer/stepper';
export * as deployer_status from './deployer/status';
export * as deployer_actions from './deployer/actions';

export * as settings_get from './settings/get';
export * as settings_save from './settings/save';

export * as masterActions_get from './masterActions/get';
export * as masterActions_getBackup from './masterActions/getBackup';
export * as masterActions_actions from './masterActions/actions';

export * as setup_get from './setup/get';
export * as setup_post from './setup/post';

export * as fxserver_commands from './fxserver/commands';
export * as fxserver_controls from './fxserver/controls';
export * as fxserver_downloadLog from './fxserver/yyyyy';

export * as player_list from './player/list';
export * as player_modal from './player/modal';
export * as player_actions from './player/actions';

export * as advanced_get from './advanced/get';
export * as advanced_actions from './advanced/actions';

//FIXME: reorganizar TODAS rotas de logs, incluindo listagem e download
export * as serverLog from'./serverLog.js';
export * as serverLogPartial from './serverLogPartial.js';
