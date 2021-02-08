-- Modifying or rewriting this resource for local use only is strongly discouraged.
-- Feel free to open an issue or pull request in our GitHub.
-- Official discord server: https://discord.gg/AFAAXzq

author 'Tabarra'
description 'Remotely Manage & Monitor your GTA5 FiveM Server'
repository 'https://github.com/tabarra/txAdmin'
version '3.3.0'

rdr3_warning 'I acknowledge that this is a prerelease build of RedM, and I am aware my resources *will* become incompatible once RedM ships.'
fx_version 'bodacious'
games { 'gta5', 'rdr3' }

-- NOTE: Due to global package constraints, js scripts will be loaded from main.js
server_scripts { 
    'main.js',
    'scripts/sv_*.lua',
}

client_scripts {
    'scripts/cl_*.lua',
}

ui_page 'scripts/warn.html'
files {
    'scripts/warn.html',
    'scripts/assets/warning_open.mp3',
    'scripts/assets/warning_pulse.mp3',
}
