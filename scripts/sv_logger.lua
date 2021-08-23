--Check Environment
if GetConvar('txAdminServerMode', 'false') ~= 'true' then
    return
end

-- micro optimization
local os_time = os.time
-- http://lua-users.org/wiki/SimpleRound
local function round(num)
    return tonumber(string.format("%.2f", num))
end

local function getPlayerData(src)
    if type(src) == 'string' then
        src = tonumber(src)
    end

    if not src then
        return false
    end

    if src <= 0 then return {name = 'console', identifiers = {}} end

    return {
        name = GetPlayerName(src),
        identifiers = GetPlayerIdentifiers(src)
    }
end

local loggerBuffer = {}
local PRINT_STRUCTURED_TRACE = `PRINT_STRUCTURED_TRACE` & 0xFFFFFFFF
--- function logger
--- Sends logs through fd3 to the server & displays the logs on the panel.
---@param src number the source of the player who did the action
---@param action string the action type
---@param data table|boolean will take a table, or a boolean if there is no data.
local function logger(src, action, data)
    loggerBuffer[#loggerBuffer+1] = {
        timestamp = round(os_time()),
        source = getPlayerData(src),
        action = action,
        data = data or false
    }
end

-- send all of the buffered logs every second
CreateThread(function()
    while true do
        Wait(1000)
        if #loggerBuffer > 0 then
            local payload = json.encode({
                type = 'txAdminLogData',
                logs = loggerBuffer
            })
            Citizen.InvokeNative(PRINT_STRUCTURED_TRACE, payload)
            loggerBuffer = {}
        end
    end
end)

logger(-1, 'txAdminClient:Started')

AddEventHandler('playerConnecting', function()
    logger(source, 'playerConnecting')
end)

-- RegisterNetEvent('playerJoining', function()
--     logger(source, 'playerJoining')
-- end)

AddEventHandler('playerDropped', function()
    logger(source, 'playerDropped')
end)

local function isInvalid(property, invalidType)
    return (property == nil or property == invalidType)
end

local explosionTypes = {'GRENADE', 'GRENADELAUNCHER', 'STICKYBOMB', 'MOLOTOV', 'ROCKET', 'TANKSHELL', 'HI_OCTANE', 'CAR', 'PLANE', 'PETROL_PUMP', 'BIKE', 'DIR_STEAM', 'DIR_FLAME', 'DIR_WATER_HYDRANT', 'DIR_GAS_CANISTER', 'BOAT', 'SHIP_DESTROY', 'TRUCK', 'BULLET', 'SMOKEGRENADELAUNCHER', 'SMOKEGRENADE', 'BZGAS', 'FLARE', 'GAS_CANISTER', 'EXTINGUISHER', 'PROGRAMMABLEAR', 'TRAIN', 'BARREL', 'PROPANE', 'BLIMP', 'DIR_FLAME_EXPLODE', 'TANKER', 'PLANE_ROCKET', 'VEHICLE_BULLET', 'GAS_TANK', 'BIRD_CRAP', 'RAILGUN', 'BLIMP2', 'FIREWORK', 'SNOWBALL', 'PROXMINE', 'VALKYRIE_CANNON', 'AIR_DEFENCE', 'PIPEBOMB', 'VEHICLEMINE', 'EXPLOSIVEAMMO', 'APCSHELL', 'BOMB_CLUSTER', 'BOMB_GAS', 'BOMB_INCENDIARY', 'BOMB_STANDARD', 'TORPEDO', 'TORPEDO_UNDERWATER', 'BOMBUSHKA_CANNON', 'BOMB_CLUSTER_SECONDARY', 'HUNTER_BARRAGE', 'HUNTER_CANNON', 'ROGUE_CANNON', 'MINE_UNDERWATER', 'ORBITAL_CANNON', 'BOMB_STANDARD_WIDE', 'EXPLOSIVEAMMO_SHOTGUN', 'OPPRESSOR2_CANNON', 'MORTAR_KINETIC', 'VEHICLEMINE_KINETIC', 'VEHICLEMINE_EMP', 'VEHICLEMINE_SPIKE', 'VEHICLEMINE_SLICK', 'VEHICLEMINE_TAR', 'SCRIPT_DRONE', 'RAYGUN', 'BURIEDMINE', 'SCRIPT_MISSIL'}

AddEventHandler('explosionEvent', function(source, ev)
    if (isInvalid(ev.damageScale, 0) or isInvalid(ev.cameraShake, 0) or isInvalid(ev.isInvisible, true) or
        isInvalid(ev.isAudible, false)) then
        return
    end

    if ev.explosionType < -1 or ev.explosionType > 77 then
        ev.explosionType = 'UNKNOWN'
    else
        ev.explosionType = explosionTypes[ev.explosionType + 1]
    end

    logger(source, 'explosionEvent', ev)
end)

-- An internal server handler, this is NOT exposed to the client
AddEventHandler('txaLogger:menuEvent', function(source, event, allowed, data)
    local message
    if event == 'healSelf' then
        message = "healing themself"

    elseif event == 'healAll' then
        message = "healing all players!"

    elseif event == 'teleportCoords' then
        if type(data) ~= 'table' then return end
        local x = data.x
        local y = data.y
        local z = data.z
        message = ("teleporting to coordinates (x=%.3f, y=%0.3f, z=%0.3f)"):format(x or 0.0, y or 0.0, z or 0.0)

    elseif event == 'teleportWaypoint' then
        message = "teleporting to a waypoint"

    elseif event == 'announcement' then
        if type(data) ~= 'string' then return end
        message = "making a server-wide announcement: " .. data

    elseif event == 'vehicleRepair' then
        message = "repairing their vehicle"

    elseif event == 'spawnVehicle' then
        if type(data) ~= 'string' then return end
        message = "spawning a vehicle (model: " .. data .. ")"

    elseif event == 'playerModeChanged' then
        if data == 'godmode' then
            message = "enabling invincibility"
        elseif data == 'noclip' then
            message = "enabling noclip"
        elseif data == 'none' then
            message = "becoming mortal (standard mode)"
        else
            message = "invalid player mode"
        end

    elseif event == 'teleportPlayer' then
        if type(data) ~= 'table' then return end
        local playerName = data.playerName
        if type(playerName) ~= 'string' then return end
        local x = data.x or 0.0
        local y = data.y or 0.0
        local z = data.z or 0.0
        message = ("teleporting to player %s (x=%.3f, y=%.3f, z=%.3f)"):format(playerName, x, y, z)

    elseif event == 'healPlayer' then
        if type(data) ~= 'string' then return end
        message = "healing player " .. data

    elseif event == 'summonPlayer' then
        if type(data) ~= 'string' then return end
        message = "summoning player " .. data

    elseif event == 'weedEffect' then
        if type(data) ~= 'string' then return end
        message = "triggering weed effect on " .. data

    elseif event == 'drunkEffect' then
        if type(data) ~= 'string' then return end
        message = "triggering drunk effect on " .. data

    elseif event == 'wildAttack' then
        if type(data) ~= 'string' then return end
        message = "triggering wild attack on " .. data

    elseif event == 'setOnFire' then
        if type(data) ~= 'string' then return end
        message = "setting ".. data .." on fire" 

    elseif event == 'clearArea' then
        if type(data) ~= 'number' then return end
        message = "clearing an area with ".. data .."m radius"

    else
        logger(source, 'DebugMessage', "unknown menu event "..event)
        return
    end
    
    local event_data = { message = message, allowed = allowed }
    logger(source, 'MenuEvent', event_data)
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
    logger(source, 'DeathNotice', logData)
end)

RegisterNetEvent('txaLogger:CommandExecuted', function(data)
    logger(source, 'CommandExecuted', data)
end)

RegisterNetEvent('txaLogger:DebugMessage', function(data)
    logger(source, 'DebugMessage', data)
end)

local function logChatMessage(src, author, text)
    local logData = {
        author = author,
        text = text
    }
    logger(src, 'ChatMessage', logData)
end
RegisterNetEvent('chatMessage', logChatMessage)
RegisterNetEvent('txaLogger:internalChatMessage', logChatMessage)
