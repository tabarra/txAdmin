if GetConvar('txAdminServerMode', 'false') == 'true' then

	local os_time = os.time
	-- http://lua-users.org/wiki/SimpleRound
	local function round(num)
		return tonumber(string.format("%.2f", num))
	end

	local function getPlayerData(src)
		if not src then return false end
		if src == -1 then return {name = 'console', identifiers = {}} end
		return {
			name = GetPlayerName(src),
			identifiers = GetPlayerIdentifiers(src)
		}
	end

	local apiPort = GetConvar("txAdmin-apiPort", "invalid")
	local apiToken = GetConvar("txAdmin-apiToken", "invalid")
	local txAdminClientVersion = GetResourceMetadata(GetCurrentResourceName(), 'version')
	if GetConvar('txAdminServerMode', 'false') ~= 'true' then
		return
	end
	if apiPort == "invalid" or apiToken == "invalid" then
		logError('API Port and Token ConVars not found. Do not start this resource if not using txAdmin.')
		return
	end

	local logs = {}
	local logBuffer = {}
	-- ^ logs to be sent if it fails with 413

	local logger = {
		['postLogs'] = function()
			if #logs == 0 then return end -- don't wanna send empty requests

			local url = ('http://127.0.0.1:%s/intercom/logger'):format(apiPort)

			PerformHttpRequest(url, function(statusCode, data)
				if statusCode == 413 then
					log(('Logger upload failed with code 413 and body %s, doing periodic upload.'):format(data.body))
					logBuffer = logs
					sendBuffered()
					logs = {}
				elseif statusCode == 200 then
					logs = {}
				else
					log(('Logger upload failed with code %s and body %s'):format(statusCode, data.body))
				end
			end, 'POST', json.encode({
				txAdminToken = apiToken,
				log = logs
			}), {['Content-Type']='application/json'})

		end,
		['log'] = function(src, action, data) 
			local logData = {
				timestamp = round(os_time()/1000),
				source = getPlayerData(src),
				-- just converting the js to lua currently, this might not even be needed 
				-- because it **should** get auto-converted to false. 
				data = data and data or false
			}
			logs[#logs+1] = logData
		end,
	}

	-- TODO: Implement reupload
	function sendBuffered()
		CreateThread(function()
		end)
	end

	CreateThread(function()
		while true do
			logger['postLogs']()
			Wait(2500)
		end
	end)

	AddEventHandler('playerConnecting', function()
		logger['log'](source, 'playerConnecting')
	end)

	AddEventHandler('playerJoining', function()
		logger['log'](source, 'playerJoining')
	end)

	AddEventHandler('playerDropped', function()
		logger['log'](source, 'playerDropped')
	end)

	local function isInvalid(property, invalidType)
		return (not property or property == invalidType)
	end

	local explosionTypes = {'DONTCARE', 'GRENADE', 'GRENADELAUNCHER', 'STICKYBOMB', 'MOLOTOV', 'ROCKET', 'TANKSHELL', 'HI_OCTANE', 'CAR', 'PLANE', 'PETROL_PUMP', 'BIKE', 'DIR_STEAM', 'DIR_FLAME', 'DIR_WATER_HYDRANT', 'DIR_GAS_CANISTER', 'BOAT', 'SHIP_DESTROY', 'TRUCK', 'BULLET', 'SMOKEGRENADELAUNCHER', 'SMOKEGRENADE', 'BZGAS', 'FLARE', 'GAS_CANISTER', 'EXTINGUISHER', 'PROGRAMMABLEAR', 'TRAIN', 'BARREL', 'PROPANE', 'BLIMP', 'DIR_FLAME_EXPLODE', 'TANKER', 'PLANE_ROCKET', 'VEHICLE_BULLET', 'GAS_TANK', 'BIRD_CRAP', 'RAILGUN', 'BLIMP2', 'FIREWORK', 'SNOWBALL', 'PROXMINE', 'VALKYRIE_CANNON', 'AIR_DEFENCE', 'PIPEBOMB', 'VEHICLEMINE', 'EXPLOSIVEAMMO', 'APCSHELL', 'BOMB_CLUSTER', 'BOMB_GAS', 'BOMB_INCENDIARY', 'BOMB_STANDARD', 'TORPEDO', 'TORPEDO_UNDERWATER', 'BOMBUSHKA_CANNON', 'BOMB_CLUSTER_SECONDARY', 'HUNTER_BARRAGE', 'HUNTER_CANNON', 'ROGUE_CANNON', 'MINE_UNDERWATER', 'ORBITAL_CANNON', 'BOMB_STANDARD_WIDE', 'EXPLOSIVEAMMO_SHOTGUN', 'OPPRESSOR2_CANNON', 'MORTAR_KINETIC', 'VEHICLEMINE_KINETIC', 'VEHICLEMINE_EMP', 'VEHICLEMINE_SPIKE', 'VEHICLEMINE_SLICK', 'VEHICLEMINE_TAR', 'SCRIPT_DRONE', 'RAYGUN', 'BURIEDMINE', 'SCRIPT_MISSIL'}

	AddEventHandler('explosionEvent', function (source, ev) 
		if(isInvalid(ev.damageScale, 0) or
		isInvalid(ev.cameraShake, 0) or
		isInvalid(ev.isInvisible, true) or
		isInvalid(ev.isAudible, false)) then
			return
		end

		if ev.explosionType < -1 or ev.explosionType > 72 then
			ev.explosionType = 'UNKNOWN'
		else
			ev.explosionType = explosionTypes[ev.explosionType + 1]
		end

		logger['log'](source, 'explosionEvent', ev)
	end)

	RegisterNetEvent('txaLogger:DeathNotice', function(killer, cause)
		local killerData
		if killer then
			killerData = getPlayerData(killer)
		end
		local logData = {
			cause = cause,
			killer = killerData
		}
		logger['log'](source, 'explosionEvent', logData)
	end)

	RegisterNetEvent('txaLogger:CommandExecuted', function(data)
		logger['log'](source, 'CommandExecuted', data)
	end)

	RegisterNetEvent('txaLogger:DebugMessage', function(data)
		logger['log'](source, 'DebugMessage', data)
	end)

	local function logChatMessage(src, author, text)
		local logData = {
			author = author,
			text = text
		}
		logger['log'](src, 'ChatMessage', logData)
	end
	RegisterNetEvent('chatMessage', logChatMessage)
	RegisterNetEvent('txaLogger:internalChatMessage', logChatMessage)
end