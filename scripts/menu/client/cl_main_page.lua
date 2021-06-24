-- =============================================
--  This file is for all main page logic not controlled in its
--  own file (mainly simpler logic)
-- =============================================

if (GetConvar('txEnableMenuBeta', 'false') ~= 'true') then
    return
end

-- Last location stored in a vec3
local lastTp

--[[ NUI CALLBACKS ]]

-- Data is a object with x, y, z
RegisterNUICallback('tpToCoords', function(data, cb)
    debugPrint(json.encode(data))
    TriggerServerEvent('txAdmin:menu:tpToCoords', data.x + 0.0, data.y + 0.0, data.z + 0.0)
    cb({})
end)

RegisterNUICallback('tpToWaypoint', function(_, cb)
    TriggerServerEvent('txAdmin:menu:tpToWaypoint')
    cb({})
end)

RegisterNUICallback('tpToPlayer', function(data, cb)
    TriggerServerEvent('txAdmin:menu:tpToPlayer', tonumber(data.id))
    cb({})
end)

RegisterNUICallback('tpBack', function(_, cb)
    if lastTp then
        TriggerServerEvent('txAdmin:menu:tpToCoords', lastTp.x, lastTp.y, lastTp.z)
        cb({})
    else
        cb({ e = true })
    end
end)

RegisterNUICallback('summonPlayer', function(data, cb)
    TriggerServerEvent('txAdmin:menu:summonPlayer', tonumber(data.id))
    cb({})
end)

RegisterNUICallback('copyCurrentCoords', function(_, cb)
    local curCoords = GetEntityCoords(PlayerPedId())
    -- We will cut coords to 4 decimal points
    local stringCoords = ('%.4f, %.4f, %.4f'):format(curCoords.x, curCoords.y, curCoords.z)
    cb({ coords = stringCoords })
end)

-- [[ Spawn weapon (only in dev, for now) ]]
if isMenuDebug then
    RegisterNUICallback('spawnWeapon', function(weapon, cb)
        debugPrint("Spawning weapon: " .. weapon)
        GiveWeaponToPed(PlayerPedId(), weapon, 500, false, true)
        cb({})
    end)
end

local oldVehVelocity = 0.0
RegisterNUICallback('spawnVehicle', function(data, cb)
    if type(data) ~= 'table' then error("Invalid spawnVehicle NUI callback data") end
    local model = data.model
    if type(model) ~= 'string' then return end
    if not IsModelValid(model) or not IsModelAVehicle(model) then
        debugPrint("^1Invalid vehicle model requested: " .. model)
        cb({ e = true })
    else
        local isAutomobile = IsThisModelACar(model)
        if isAutomobile ~= false then isAutomobile = true end

        -- collect the old velocity
        local ped = PlayerPedId()
        local oldVeh = GetVehiclePedIsIn(ped, false)
        if oldVeh and oldVeh > 0 then
            oldVehVelocity = GetEntityVelocity(oldVeh)
            DeleteVehicle(oldVeh)
        end

        TriggerServerEvent('txAdmin:menu:spawnVehicle', model, isAutomobile)
        cb({})
    end
end)

RegisterNUICallback('healPlayer', function(data, cb)
    TriggerServerEvent('txAdmin:menu:healPlayer', tonumber(data.id))
    cb({})
end)

RegisterNUICallback('healMyself', function(_, cb)
    TriggerServerEvent('txAdmin:menu:healMyself')
    cb({})
end)

RegisterNUICallback('healAllPlayers', function(_, cb)
    TriggerServerEvent('txAdmin:menu:healAllPlayers')
    cb({})
end)

-- Data will be an object with a message attribute
RegisterNUICallback('sendAnnouncement', function(data, cb)
    debugPrint(data.message)
    TriggerServerEvent('txAdmin:menu:sendAnnouncement', data.message)
    cb({})
end)

RegisterNUICallback('fixVehicle', function(_, cb)
    local ped = PlayerPedId()
    local veh = GetVehiclePedIsIn(ped, false)
    if (veh == 0) then
        return cb({ e = true })
    end

    TriggerServerEvent('txAdmin:menu:fixVehicle')
    cb({})
end)

--[[ EVENT HANDLERS ]]

RegisterNetEvent('txAdmin:menu:fixVehicle', function()
    local ped = PlayerPedId()
    local veh = GetVehiclePedIsIn(ped, false)
    if veh and veh > 0 then
        SetVehicleUndriveable(veh, false)
        SetVehicleFixed(veh)
        SetVehicleEngineOn(veh, true, false)
        SetVehicleDirtLevel(veh, 0.0)
        SetVehicleOnGroundProperly(veh)
    end
end)

-- Spawn vehicles, with support for entity lockdown
RegisterNetEvent('txAdmin:events:queueSeatInVehicle', function(vehNetID, seat)
    if type(vehNetID) ~= 'number' then return end
    if type(seat) ~= 'number' then return end

    local tries = 0
    while not NetworkDoesEntityExistWithNetworkId(vehNetID) and tries < 1000 do Wait(0) end
    if tries >= 1000 then
        print("^1Failed to seat into vehicle (net=" .. vehNetID .. ")")
        return
    end

    local veh = NetToVeh(vehNetID)
    if veh and veh > 0 then
        SetPedIntoVehicle(PlayerPedId(), veh, seat)
        if seat == -1 then
            SetVehicleEngineOn(veh, true, true, false)
            SetEntityVelocity(veh, oldVehVelocity)
            --SetVehicleForwardSpeed(veh, #(oldVehVelocity[1] + oldVehVelocity[2]))
            SetVehicleOnGroundProperly(veh)
        end
    end
    oldVehVelocity = 0.0
end)

-- Teleport the player to the coordinates
---@param x number
---@param y number
---@param z number
RegisterNetEvent('txAdmin:menu:tpToCoords', function(x, y, z)
    local ped = PlayerPedId()
    lastTp = GetEntityCoords(ped)

    DoScreenFadeOut(500)
    while not IsScreenFadedOut() do Wait(0) end
    ped = PlayerPedId()
    if z == 0 then
        local _z = FindZForCoords(x, y)
        if _z ~= nil then z = _z end
    end
    SetPedCoordsKeepVehicle(ped, x, y, z)
    DoScreenFadeIn(500)
    SetGameplayCamRelativeHeading(0)
end)

-- Teleport to the current waypoint
RegisterNetEvent('txAdmin:menu:tpToWaypoint', function()
    local waypoint = GetFirstBlipInfoId(GetWaypointBlipEnumId())
    if waypoint and waypoint > 0 then
        local ped = PlayerPedId()
        lastTp = GetEntityCoords(ped)

        DoScreenFadeOut(500)
        while not IsScreenFadedOut() do Wait(0) end

        local blipCoords = GetBlipInfoIdCoord(waypoint)
        local x = blipCoords[1]
        local y = blipCoords[2]
        local z = 0
        local _z = FindZForCoords(x, y)
        if _z ~= nil then z = _z end
        SetPedCoordsKeepVehicle(ped, x, y, z)
        DoScreenFadeIn(500)
        SetGameplayCamRelativeHeading(0)
    else
        sendSnackbarMessage("error", "You have no waypoint set!")
    end
end)