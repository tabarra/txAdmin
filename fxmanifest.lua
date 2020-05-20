fx_version 'bodacious'
games { 'gta5' }

author 'Tabarra'
description 'Remotely Manage & Monitor your GTA5 FiveM Server'
repository 'https://github.com/tabarra/txAdmin'
version '2.5.0-ui'


-- NOTE: Due to global package constraints, js scripts will be loaded from main.js
server_scripts { 
    'main.js',
    'scripts/sv_*.lua',
}

client_scripts {
    'scripts/cl_*.js',
    'scripts/cl_*.lua',
}

ui_page 'scripts/warn.html'
files {
    'scripts/warn.html',
    'scripts/warning_open.mp3',
    'scripts/warning_pulse.mp3',
}
