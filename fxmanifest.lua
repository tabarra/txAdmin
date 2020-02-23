fx_version 'bodacious'
games { 'gta5' }

author 'Tabarra'
description 'Remotely manage&monitor your GTA5 FiveM Server'
repository 'https://github.com/tabarra/txAdmin'
version '2.0.0-conv'

server_script 'starter.js'

server_scripts { 
    -- we will load these from starter.js due to global package constraints
    --'extensions/**/resource/sv_*.js',
    'extensions/**/resource/sv_*.lua',
}

client_scripts {
    'extensions/**/resource/cl_*.js',
    'extensions/**/resource/cl_*.lua',
}