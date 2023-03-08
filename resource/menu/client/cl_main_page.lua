-- =============================================
--  This file is for all main page logic not controlled in its
--  own file (mainly simpler logic)
-- =============================================
if (GetConvar('txAdmin-menuEnabled', 'false') ~= 'true') then
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

RegisterNUICallback('clearArea', function(radius, cb)
    TriggerServerEvent('txAdmin:menu:clearArea', radius)
    cb({})
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
        local VehicleType = GetVehicleClassFromName(model)
        local types = {
            [8] = "bike",
            [11] = "trailer",
            [13] = "bike",
            [14] = "boat",
            [15] = "heli",
            [16] = "plane",
            [21] = "train",
        }
        local modelType = types[VehicleType] or "automobile"
        if model == GetHashKey("submersible") or model == GetHashKey("submersible2") then
            modelType = "submarine"
        end
        -- collect the old velocity
        local ped = PlayerPedId()
        local oldVeh = GetVehiclePedIsIn(ped, false)
        if oldVeh and oldVeh > 0 then
            oldVehVelocity = GetEntityVelocity(oldVeh)
            DeleteVehicle(oldVeh)
        end

        TriggerServerEvent('txAdmin:menu:spawnVehicle', model, modelType)
        cb({})
    end
end)

RegisterNUICallback("deleteVehicle", function(data, cb)
    local ped = PlayerPedId()
    local veh = GetVehiclePedIsIn(ped, false)
    if veh and veh > 0 then
        local netId = NetworkGetNetworkIdFromEntity(veh)
        TriggerServerEvent("txAdmin:menu:deleteVehicle", netId)

        cb({})
    else
        cb({ e = true })
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


RegisterNUICallback('boostVehicle', function(_, cb)
    local ped = PlayerPedId()
    local veh = GetVehiclePedIsIn(ped, false)
    if (veh == 0) then
        return cb({ e = true })
    end

    TriggerServerEvent('txAdmin:menu:boostVehicle')
    cb({})
end)

--[[ EVENT HANDLERS ]]

local function setVehicleHandlingValue(veh, field, newValue)
    -- local currValue = GetVehicleHandlingFloat(veh, 'CHandlingData', field)
    SetVehicleHandlingField(veh, 'CHandlingData', field, newValue * 1.0)
end
local function setVehicleHandlingModifier(veh, field, multiplier)
    local currValue = GetVehicleHandlingFloat(veh, 'CHandlingData', field)
    local newValue = (multiplier * 1.0) * currValue;
    SetVehicleHandlingField(veh, 'CHandlingData', field, newValue)
end

local boostableVehicleClasses = {
    [0]='Compacts',
    [1]='Sedans',
    [2]='SUVs',
    [3]='Coupes',
    [4]='Muscle',
    [5]='Sports Classics',
    [6]='Sports',
    [7]='Super',
    -- [8]='Motorcycles',
    [9]='Off-road',
    -- [10]='Industrial',
    [11]='Utility',
    [12]='Vans',
    -- [13]='Cycles',
    -- [14]='Boats',
    -- [15]='Helicopters',
    -- [16]='Planes',
    [17]='Service',
    [18]='Emergency',
    [19]='Military',
    [20]='Commercial',
    -- [21]='Trains',
    [22]='Open Wheel'
}

RegisterNetEvent('txAdmin:menu:boostVehicle', function()
    local ped = PlayerPedId()
    local veh = GetVehiclePedIsIn(ped, false)

    --Check if in vehicle
    if not veh or veh <= 0 then
        return sendSnackbarMessage('error', 'nui_menu.page_main.vehicle.not_in_veh_error', true)
    end

    --Check if vehicle already boosted
    --NOTE: state bags were too complicated, and checking for specific float didn't work due to precision
    local boostedFlag = GetVehicleHandlingFloat(veh, 'CHandlingData', 'fInitialDriveMaxFlatVel')
    if boostedFlag == 300.401214599609375 then
        return sendSnackbarMessage('error', 'nui_menu.page_main.vehicle.boost.already_boosted', true)
    end

    --Check if vehicle is in fact a car
    local vehClass = GetVehicleClass(veh)
    if not boostableVehicleClasses[vehClass] then
        return sendSnackbarMessage('error', 'nui_menu.page_main.vehicle.boost.unsupported_class', true)
    end
    
    --Modify car
    setVehicleHandlingValue(veh, 'fInitialDriveMaxFlatVel', 300.40120); --the signature, don't change
    setVehicleHandlingValue(veh, 'fHandBrakeForce', 10.0);
    setVehicleHandlingValue(veh, 'fBrakeForce', 20.0);
    setVehicleHandlingModifier(veh, 'fTractionCurveMin', 2.1);
    setVehicleHandlingModifier(veh, 'fTractionCurveMax', 2.5);
    setVehicleHandlingModifier(veh, 'fInitialDriveForce', 2.0); --accelerates real fast, almost no side effects
    setVehicleHandlingModifier(veh, 'fDriveInertia', 1.25);
    setVehicleHandlingValue(veh, 'fInitialDragCoeff', 10.0);
    
    SetVehicleHandlingVector(veh, 'CHandlingData', 'vecInertiaMultiplier', vector3(0.1, 0.1, 0.1))
    setVehicleHandlingValue(veh, 'fAntiRollBarForce', 0.0001); --testar, o certo é 0~1
    setVehicleHandlingValue(veh, 'fTractionLossMult', 0.00001); --testar, o certo é >1
    setVehicleHandlingValue(veh, 'fRollCentreHeightFront', 0.5); --testar, o certo é 0~1
    setVehicleHandlingValue(veh, 'fRollCentreHeightRear', 0.5); --testar, o certo é 0~1

    PlaySoundFrontend(-1, 'CONFIRM_BEEP', 'HUD_MINI_GAME_SOUNDSET', 1)
    SetVehicleNumberPlateText(veh, "TX B00ST")
    SetVehicleCanBreak(veh, false) -- If this is set to false, the vehicle simply can't break
    SetVehicleEngineCanDegrade(veh, false) -- Engine strong
    SetVehicleMod(veh, 15, 3, false) -- Max Suspension
    SetVehicleMod(veh, 11, 3, false) -- Max Engine
    SetVehicleMod(veh, 16, 4, false) -- Max Armor
    SetVehicleMod(veh, 12, 2, false) -- Max Brakes
    SetVehicleMod(veh, 13, 2, false) -- Max Transmission
    ToggleVehicleMod(veh, 18, true) -- modTurbo
    SetVehicleMod(veh, 18, 0, false) -- Turbo
    SetVehicleNitroEnabled(veh, true) -- Gives the vehicle a nitro boost
    SetVehicleTurboPressure(veh, 100.0) -- Pressure of the turbo is 100%
    EnableVehicleExhaustPops(veh, true) -- This forces the exhaust to always "pop"
    SetVehicleCheatPowerIncrease(veh, 1.8) -- Torque multiplier

    sendSnackbarMessage('success', 'nui_menu.page_main.vehicle.boost.success', true)
end)

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

RegisterNetEvent('txAdmin:menu:clearArea', function(radius)
    local curCoords = GetEntityCoords(PlayerPedId())
    local radiusToFloat = radius + 0.0
    debugPrint(('Radius to clear %d'):format(radius))
    -- WTF?: User reports that this native actually clears dead peds compared to
    -- ClearArea? Weird considering Gottfried updated this native from _CLEAR_AREA_OF_EVERYTHING
    -- after found nativedb info. Maybe needs research lmao?
    ClearAreaLeaveVehicleHealth(curCoords.x, curCoords.y, curCoords.z, radiusToFloat, false, false, false, false, false)
end)

local function handleTpNormally(x, y, z)
    local ped = PlayerPedId()
    local veh = GetVehiclePedIsIn(ped, false)
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

    SetGameplayCamRelativeHeading(0)
end

local function handleTpForFreecam(x, y, z)
    debugPrint("Handling TP for freecam")
    local ped = PlayerPedId()
    -- As we allow the freecam to have a vehicle attached. We need to make
    -- sure to teleport this as well
    local veh = GetVehiclePedIsIn(ped, false)
    debugPrint('Freecam has vehicle attached: ' .. tostring(veh))
    if veh and veh > 0 then
        SetEntityCoords(veh, x, y, z)
    end
    SetFreecamPosition(x, y, z)
end

local function teleportToCoords(coords)
    if type(coords) ~= 'vector3' then print("^1Invalid coords") end
    local x = coords[1]
    local y = coords[2]
    local z = coords[3]
    local ped = PlayerPedId()

    DoScreenFadeOut(500)
    while not IsScreenFadedOut() do Wait(0) end

    if IsFreecamActive() then
        local curCamPos = GetFreecamPosition()
        lastTpCoords = curCamPos
        handleTpForFreecam(x, y, z)
    else
        lastTpCoords = GetEntityCoords(ped)
        handleTpNormally(x, y, z)
    end

    DoScreenFadeIn(500)
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
        sendSnackbarMessage('success', 'nui_menu.page_main.teleport.generic_success', true)
        local blipCoords = GetBlipInfoIdCoord(waypoint)
        teleportToCoords(vec3(blipCoords[1], blipCoords[2], 0))
    else
        sendSnackbarMessage('error', 'nui_menu.page_main.teleport.waypoint.error', true)
    end
end)
