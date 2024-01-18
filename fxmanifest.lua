-- Modifying or rewriting this resource for local use only is strongly discouraged.
-- Feel free to open an issue or pull request in our GitHub.
-- Official discord server: https://discord.gg/txAdmin

author 'Tabarra'
description 'Remotely Manage & Monitor your GTA5 FiveM Server'
repository 'https://github.com/tabarra/txAdmin'
version '7.0.0'
ui_label 'txAdmin'

rdr3_warning 'I acknowledge that this is a prerelease build of RedM, and I am aware my resources *will* become incompatible once RedM ships.'
fx_version 'cerulean'
games { 'gta5', 'rdr3' }

-- NOTE: All server_scripts will be executed both on monitor and server mode 
-- NOTE: Due to global package constraints, js scripts will be loaded from entrypoint.js
-- NOTE: Due to people drag-n-dropping their artifacts, we can't do globbing
shared_scripts {
    'resource/shared.lua'
}

server_scripts {
    'entrypoint.js',
    'resource/sv_main.lua', --must run first
    'resource/sv_admins.lua',
    'resource/sv_logger.lua',
    'resource/sv_resources.lua',
    'resource/sv_playerlist.lua',
    'resource/menu/server/sv_webpipe.lua',
    'resource/menu/server/sv_base.lua',
    'resource/menu/server/sv_functions.lua',
    'resource/menu/server/sv_main_page.lua',
    'resource/menu/server/sv_vehicle.lua',
    'resource/menu/server/sv_freeze_player.lua',
    'resource/menu/server/sv_trollactions.lua',
    'resource/menu/server/sv_player_modal.lua',
    'resource/menu/server/sv_spectate.lua',
    'resource/menu/server/sv_player_mode.lua'
}

client_scripts {
    'resource/cl_main.lua',
    'resource/cl_logger.lua',
    'resource/cl_playerlist.lua',
    'resource/menu/client/cl_webpipe.lua',
    'resource/menu/client/cl_base.lua',
    'resource/menu/client/cl_functions.lua',
    'resource/menu/client/cl_instructional_ui.lua',
    'resource/menu/client/cl_main_page.lua',
    'resource/menu/client/cl_vehicle.lua',
    'resource/menu/client/cl_player_ids.lua',
    'resource/menu/client/cl_player_mode.lua',
    'resource/menu/client/cl_spectate.lua',
    'resource/menu/client/cl_trollactions.lua',
    'resource/menu/client/cl_freeze.lua',
    'resource/menu/vendor/freecam/utils.lua',
    'resource/menu/vendor/freecam/config.lua',
    'resource/menu/vendor/freecam/main.lua',
    'resource/menu/vendor/freecam/camera.lua',
}

ui_page 'nui/index.html'

files {
    'nui/**/*',

    -- WebPipe optimization:
    'panel/**/*',
    'web/public/**/*',
}
