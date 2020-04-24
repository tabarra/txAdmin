fx_version 'bodacious'
games { 'gta5' }

author 'Tabarra'
description 'Remotely Manage & Monitor your GTA5 FiveM Server'
repository 'https://github.com/tabarra/txAdmin'
version '2.4.0'

server_script 'main.js'

-- NOTE: Due to global package constraints, js scripts will be loaded from main.js
server_scripts { 
    'scripts/sv_*.lua',
}

client_scripts {
    'scripts/cl_*.js',
    'scripts/cl_*.lua',
}
