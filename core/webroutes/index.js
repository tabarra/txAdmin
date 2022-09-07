export { default as dashboard } from './dashboard.js';
export { default as diagnostics } from './diagnostics.js';
export { default as intercom } from './intercom.js';
export { default as liveConsole } from './liveConsole.js';
export { default as resources } from './resources.js';
export { default as status } from './status.js';
export { default as chartData } from './chartData.js';
export { default as txAdminLog } from './txAdminLog.js';

export { default as auth_get } from './authentication/get';
export { default as auth_addMaster } from './authentication/addMaster';
export { default as auth_providerRedirect } from './authentication/providerRedirect';
export { default as auth_providerCallback } from './authentication/providerCallback';
export { default as auth_verifyPassword } from './authentication/verifyPassword';
export { default as auth_changePassword } from './authentication/changePassword';
export { default as auth_nui } from './authentication/nui';

export { default as adminManager_get } from './adminManager/get';
export { default as adminManager_actions } from './adminManager/actions';

export { default as cfgEditor_get } from './cfgEditor/get';
export { default as cfgEditor_save } from './cfgEditor/save';

export { default as deployer_stepper } from './deployer/stepper';
export { default as deployer_status } from './deployer/status';
export { default as deployer_actions } from './deployer/actions';

export { default as settings_get } from './settings/get';
export { default as settings_save } from './settings/save';

export { default as masterActions_get } from './masterActions/get';
export { default as masterActions_getBackup } from './masterActions/getBackup';
export { default as masterActions_actions } from './masterActions/actions';

export { default as setup_get } from './setup/get';
export { default as setup_post } from './setup/post';

export { default as fxserver_commands } from './fxserver/commands';
export { default as fxserver_controls } from './fxserver/controls';
export { default as fxserver_downloadLog } from './fxserver/downloadLog';
export { default as fxserver_schedule } from './fxserver/schedule';

export { default as player_list } from './player/list';
export { default as player_modal } from './player/modal';
export { default as player_actions } from './player/actions';

export { default as advanced_get } from './advanced/get';
export { default as advanced_actions } from './advanced/actions';

//FIXME: reorganizar TODAS rotas de logs, incluindo listagem e download
export { default as serverLog } from './serverLog.js';
export { default as serverLogPartial } from './serverLogPartial.js';
