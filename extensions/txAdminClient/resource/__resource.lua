resource_manifest_version '44febabe-d386-4d18-afbe-5e627f4af937'

author 'Tabarra'
description 'Helper resource for txAdmin'
repository 'https://github.com/tabarra/txAdmin'
version '1.5.0'

server_scripts {
	"sv_main.lua",
	"sv_logger.js"
}

client_scripts {
	"cl_logger.js"
}
