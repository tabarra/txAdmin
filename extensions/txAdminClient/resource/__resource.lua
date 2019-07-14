resource_manifest_version '44febabe-d386-4d18-afbe-5e627f4af937'

description 'txAdminClient - Helper resource for txAdmin'
repository 'https://github.com/tabarra/txAdmin'
version '1.1.0'

server_only 'yes'

server_scripts {
	"txa_server.lua"
}
