if GetConvar('txAdminServerMode', 'false') == 'true' then
	-- micro optimization
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
	if apiPort == "invalid" or apiToken == "invalid" then
		logError('API Port and Token ConVars not found. Do not start this resource if not using txAdmin.')
		return
	end

	local logs = {}
	local logBuffer = {}
	-- ^ logs to be sent if it fails with 413

	local function sendData(type, logData)
		PerformHttpRequest(('http://127.0.0.1:%s/intercom/logger'):format(apiPort), function(statusCode, data)
			if statusCode == 413 then
				log(('Logger upload failed with code 413 and body %s, doing periodic upload.'):format(data.body))
				if type == 'logs' then 
					logBuffer = logs
					sendBuffered()
					logs = {}
				elseif type == 'logbuffer' then
					log(('Logger upload failed with code 413 and body %s, not retrying.'):format(data.body))
				end
			elseif statusCode == 200 then
				-- log buffer gets wip
				if type == 'logs' then
					logs = {}
				end
			else
				log(('Logger upload failed with code %s and body %s'):format(statusCode, data.body))
			end
		end, 'POST', json.encode({
			txAdminToken = apiToken,
			log = logData
		}), {['Content-Type']='application/json'})
	end

	local logger = {
		['postLogs'] = function()
			-- NOTE: Remove this print after debugging 
			if #logs == 0 then return print('skip sending, no data') end -- don't wanna send empty requests
			sendData('logs', logs)
		end,
		['log'] = function(src, action, data) 
			local logData = {
				timestamp = round(os_time()),
				source = getPlayerData(src),
				-- just converting the js to lua currently, this might not even be needed 
				-- because it **should** get auto-converted to false. 
				data = data and data or false
			}
			logs[#logs+1] = logData
		end,
	}

	
	
	function sendBuffered()
		CreateThread(function()
			local buffer = logBuffer
			local sendBuffer = {}

			-- seperate into different buffers and then send them seperately to get around upload limit
			-- and hopefully avoid as much data loss as possible, (only lose one buffer instead of an entire set of logs)
			for i = 1, #buffer do
				-- this logic is a bit questionable, can probably simplify it
				local bufNum = math.floor(i / 3) + 1 -- add one so we don't start at 0
				sendBuffer[bufNum] = sendBuffer[bufNum] or {}
				sendBuffer[bufNum][#sendBuffer[bufNum] + 1] = buffer[i]
			end
			for i = 1, #sendBuffer do
				sendData('logBuffer', sendBuffer[i])
				-- might not need to wait here, don't know if we can get rate limited
				Wait(50)
			end
		end)
	end

	CreateThread(function()
		while true do
			logger['postLogs']()
			Wait(2500)
			-- NOTE: Remove this after debugging
			for i = 1, 10 do
				logger['log'](1, 'playerDropped')
			end
		end
	end)

	AddEventHandler('playerConnecting', function()
		logger['log'](source, 'playerConnecting')
	end)

	RegisterNetEvent('playerJoining', function()
		logger['log'](source, 'playerJoining')
	end)

	AddEventHandler('playerDropped', function()
		logger['log'](source, 'playerDropped')
	end)

	local function isInvalid(property, invalidType)
		return (property == nil or property == invalidType)
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