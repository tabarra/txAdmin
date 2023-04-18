-- Prevent running if menu is disabled
if not TX_MENU_ENABLED then return end

-- =============================================
--  This file is for all vehicle-related menu features
-- =============================================

--[[ NUI CALLBACKS ]]

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

        TriggerServerEvent('txsv:req:vehicle:spawn', model, modelType)
        cb({})
    end
end)

RegisterNUICallback("deleteVehicle", function(data, cb)
    local ped = PlayerPedId()
    local veh = GetVehiclePedIsIn(ped, false)
    if IS_REDM and IsPedOnMount(ped) then
        veh = GetMount(ped)
    end
    if veh and veh > 0 then
        local vehNetId = NetworkGetNetworkIdFromEntity(veh)
        TriggerServerEvent("txsv:req:vehicle:delete", vehNetId)

        cb({})
    else
        cb({ e = true })
    end
end)


RegisterNUICallback('fixVehicle', function(_, cb)
    local ped = PlayerPedId()
    local veh = GetVehiclePedIsIn(ped, false)
    if (veh == 0) then
        return cb({ e = true })
    end

    TriggerServerEvent('txsv:req:vehicle:fix')
    cb({})
end)


RegisterNUICallback('boostVehicle', function(_, cb)
    local ped = PlayerPedId()
    local veh = GetVehiclePedIsIn(ped, false)
    if (veh == 0) then
        return cb({ e = true })
    end

    TriggerServerEvent('txsv:req:vehicle:boost')
    cb({})
end)


--[[ EVENT HANDLERS + FUNCTION LOGIC ]]

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

RegisterNetEvent('txcl:vehicle:boost', function()
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

    playLibrarySound('confirm')
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

RegisterNetEvent('txcl:vehicle:fix', function()
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
        return sendSnackbarMessage('error', 'Failed to seat into vehicle (net=' .. vehNetID .. ')')
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
