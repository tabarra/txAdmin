fx_version 'bodacious'
games { 'gta5' }

author 'Tabarra'
description 'Remotely Manage & Monitor your GTA5 FiveM Server'
repository 'https://github.com/tabarra/txAdmin'
version '2.0.0-rc1'

server_script 'starter.js'

server_scripts { 
    -- NOTE: we will load js extensions from starter.js due to global package constraints
    --'extensions/**/resource/sv_*.js',
    'extensions/**/resource/sv_*.lua',
}

client_scripts {
    'extensions/**/resource/cl_*.js',
    'extensions/**/resource/cl_*.lua',
}
