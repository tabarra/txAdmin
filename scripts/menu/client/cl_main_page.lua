-- =============================================
--  This file is for all main page logic not controlled in its
--  own file (mainly simpler logic)
-- =============================================

if (GetConvar('txEnableMenuBeta', 'false') ~= 'true') then
    return
end


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
    if lastTpCoords then
        TriggerServerEvent('txAdmin:menu:tpToCoords', lastTpCoords.x, lastTpCoords.y, lastTpCoords.z)
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
    local ped = PlayerPedId()
    local curCoords = GetEntityCoords(ped)
    local currHeading = GetEntityHeading(ped)
    -- We will cut coords to 4 decimal points
    local stringCoords = ('%.4f, %.4f, %.4f, %.4f'):format(curCoords.x, curCoords.y, curCoords.z, currHeading)
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

---@param coords vec3
local function teleportToCoords(coords)
    if type(coords) ~= 'vector3' then print("^1Invalid coords") end
    local x = coords[1]
    local y = coords[2]
    local z = coords[3]
    local ped = PlayerPedId()
    local veh = GetVehiclePedIsIn(ped, false)
    lastTpCoords = GetEntityCoords(ped)
    
    DoScreenFadeOut(500)
    while not IsScreenFadedOut() do Wait(0) end
    -- refresh
    ped = PlayerPedId()
    SetPedCoordsKeepVehicle(ped, x, y, 100.0)
    if veh > 0 then
        FreezeEntityPosition(veh, true)
    else
        FreezeEntityPosition(ped, true)
    end
    while IsEntityWaitingForWorldCollision(ped) do
        debugPrint("waiting for collision...")
        Wait(100)
    end
    
    -- Automatically calculate ground Z
    if z == 0 then
        local _finalZ
        local DELAY = 500
        for i = 1, 5 do
            if _finalZ ~= nil then break end
            debugPrint("Z calc attempt #" .. i .. " (" .. (i * DELAY) .. "ms)")
            _finalZ = FindZForCoords(x, y)
            if _z == nil then
                debugPrint("Didn't resolve! Trying again in " .. DELAY)
                Wait(DELAY)
            end
        end
        if _finalZ ~= nil then
            z = _finalZ
        end
    end
    -- update ped again
    ped = PlayerPedId()
    SetPedCoordsKeepVehicle(ped, x, y, z)
    if veh > 0 then
        FreezeEntityPosition(veh, false)
    else
        FreezeEntityPosition(ped, false)
    end
    DoScreenFadeIn(500)
    SetGameplayCamRelativeHeading(0)
end

-- Teleport the player to the coordinates
---@param x number
---@param y number
---@param z number
RegisterNetEvent('txAdmin:menu:tpToCoords', function(x, y, z)
    teleportToCoords(vec3(x, y, z))
end)

-- Teleport to the current waypoint
RegisterNetEvent('txAdmin:menu:tpToWaypoint', function()
    local waypoint = GetFirstBlipInfoId(GetWaypointBlipEnumId())
    if waypoint and waypoint > 0 then
        local blipCoords = GetBlipInfoIdCoord(waypoint)
        teleportToCoords(vec3(blipCoords[1], blipCoords[2], 0))
    else
        sendSnackbarMessage("error", "You have no waypoint set!")
    end
end)
