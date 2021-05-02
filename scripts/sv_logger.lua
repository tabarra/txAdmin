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
local PRINT_STRUCTURED_TRACE = GetHashKey('PRINT_STRUCTURED_TRACE')
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
            Citizen.InvokeNative(PRINT_STRUCTURED_TRACE & 0xFFFFFFFF, payload)
            loggerBuffer = {}
        end
    end
end)

logger(-1, 'txAdminClient:Started')

AddEventHandler('playerConnecting', function()
    logger(source, 'playerConnecting')
end)

RegisterNetEvent('playerJoining', function()
    logger(source, 'playerJoining')
end)

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
