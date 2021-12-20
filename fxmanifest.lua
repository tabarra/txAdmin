-- Modifying or rewriting this resource for local use only is strongly discouraged.
-- Feel free to open an issue or pull request in our GitHub.
-- Official discord server: https://discord.gg/AFAAXzq

author 'Tabarra'
description 'Remotely Manage & Monitor your GTA5 FiveM Server'
repository 'https://github.com/tabarra/txAdmin'
version '4.11.0'
ui_label 'txAdmin'

rdr3_warning 'I acknowledge that this is a prerelease build of RedM, and I am aware my resources *will* become incompatible once RedM ships.'
fx_version 'cerulean'
games { 'gta5', 'rdr3' }

-- NOTE: Due to global package constraints, js scripts will be loaded from main.js
-- NOTE: Due to people drag-n-dropping their artifacts, we can't do globbing
shared_scripts {
    'scripts/menu/shared.lua'
}

server_scripts {
    'main.js',
    'scripts/sv_main.lua',
    'scripts/sv_admins.lua',
    'scripts/sv_logger.lua',
    'scripts/sv_playerlist.lua',
    'scripts/menu/server/sv_webpipe.lua',
    'scripts/menu/server/sv_base.lua',
    'scripts/menu/server/sv_functions.lua',
    'scripts/menu/server/sv_main_page.lua',
    'scripts/menu/server/sv_freeze_player.lua',
    'scripts/menu/server/sv_trollactions.lua',
    'scripts/menu/server/sv_player_modal.lua',
    'scripts/menu/server/sv_spectate.lua',
    'scripts/menu/server/sv_player_mode.lua'
}

client_scripts {
    'scripts/cl_main.lua',
    'scripts/cl_logger.lua',
    'scripts/cl_playerlist.lua',
    'scripts/menu/client/cl_webpipe.lua',
    'scripts/menu/client/cl_base.lua',
    'scripts/menu/client/cl_functions.lua',
    'scripts/menu/client/cl_main_page.lua',
    'scripts/menu/client/cl_misc.lua',
    'scripts/menu/client/cl_player_ids.lua',
    'scripts/menu/client/cl_player_mode.lua',
    'scripts/menu/client/cl_spectate.lua',
    'scripts/menu/client/cl_trollactions.lua',
    'scripts/menu/client/cl_freeze.lua',
    'scripts/menu/vendor/freecam/utils.lua',
    'scripts/menu/vendor/freecam/config.lua',
    'scripts/menu/vendor/freecam/main.lua',
    'scripts/menu/vendor/freecam/camera.lua',
}

ui_page 'scripts/menu/nui/index.html'

files {
    'scripts/menu/nui/index.html',
    'scripts/menu/nui/**/*',

    -- WebPipe optimization:
    'web/public/css/coreui.min.css',
    'web/public/css/jquery-confirm.min.css',
    'web/public/css/txAdmin.css',
    'web/public/css/dark.css',
    'web/public/js/coreui.bundle.min.js',
    'web/public/js/bootstrap-notify.min.js',
    'web/public/js/jquery-confirm.min.js',
    'web/public/js/txadmin/base.js',
    'web/public/js/txadmin/main.js',
    'web/public/js/txadmin/players.js',
}
