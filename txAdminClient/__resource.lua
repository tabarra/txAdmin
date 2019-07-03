-- resource_manifest_version '77731fab-63ca-442c-a67b-abc70f28dfa5'
resource_manifest_version '44febabe-d386-4d18-afbe-5e627f4af937'

description 'txAdminClient - Helper resource for txAdmin'
repository 'https://github.com/tabarra/txAdmin'
version '1.0.0'

client_scripts {
	"txa_client.lua"
}

server_scripts {
	"txa_server.lua"
}
