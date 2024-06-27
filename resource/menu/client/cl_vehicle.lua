-- Prevent running if menu is disabled
if not TX_MENU_ENABLED then return end

-- =============================================
--  This file is for all vehicle-related menu features
-- =============================================

--[[ NUI CALLBACKS ]]

-- NOTE: this is not a complete list, but most others have the type "automobile"
local vehClassNamesEnum = {
    [8] = "bike",
    [11] = "trailer",
    [13] = "bike",
    [14] = "boat",
    [15] = "heli",
    [16] = "plane",
    [21] = "train",
}

-- Since we don't have the vehicle types on the server, we need this translation table
-- NOTE: this list was generated for game build 2802/mpchristmas3
-- How to update the list: https://gist.github.com/tabarra/32ef90524188093ab4218ee7b5121269
local mismatchedTypes = {
    ["airtug"] = "automobile",       -- trailer
    ["avisa"] = "submarine",         -- boat
    ["blimp"] = "heli",              -- plane
    ["blimp2"] = "heli",             -- plane
    ["blimp3"] = "heli",             -- plane
    ["caddy"] = "automobile",        -- trailer
    ["caddy2"] = "automobile",       -- trailer
    ["caddy3"] = "automobile",       -- trailer
    ["chimera"] = "automobile",      -- bike
    ["docktug"] = "automobile",      -- trailer
    ["forklift"] = "automobile",     -- trailer
    ["kosatka"] = "submarine",       -- boat
    ["mower"] = "automobile",        -- trailer
    ["policeb"] = "bike",            -- automobile
    ["ripley"] = "automobile",       -- trailer
    ["rrocket"] = "automobile",      -- bike
    ["sadler"] = "automobile",       -- trailer
    ["sadler2"] = "automobile",      -- trailer
    ["scrap"] = "automobile",        -- trailer
    ["slamtruck"] = "automobile",    -- trailer
    ["Stryder"] = "automobile",      -- bike
    ["submersible"] = "submarine",   -- boat
    ["submersible2"] = "submarine",  -- boat
    ["thruster"] = "heli",           -- automobile
    ["towtruck"] = "automobile",     -- trailer
    ["towtruck2"] = "automobile",    -- trailer
    ["tractor"] = "automobile",      -- trailer
    ["tractor2"] = "automobile",     -- trailer
    ["tractor3"] = "automobile",     -- trailer
    ["trailersmall2"] = "trailer",   -- automobile
    ["utillitruck"] = "automobile",  -- trailer
    ["utillitruck2"] = "automobile", -- trailer
    ["utillitruck3"] = "automobile", -- trailer
}

local function handleSpawnRequestFivem(model)
    if not IsModelAVehicle(model) then
        debugPrint("^1Model provided is not a vehicle: " .. model)
        return false
    end

    --Resolve vehicle type, required for server setter
    --NOTE: check if GetVehicleTypeFromName is already available
    local modelType
    if mismatchedTypes[model] then
        modelType = mismatchedTypes[model]
    else
        local modelClassNumber = GetVehicleClassFromName(model)
        modelType = vehClassNamesEnum[modelClassNumber] or "automobile"
    end

    --Request from server
    TriggerServerEvent('txsv:req:vehicle:spawn:fivem', model, modelType)
    return true
end

local function handleSpawnRequestRedm(model)
    --check if model is valid vehicle or horse (IsThisModelAHorse)
    if not IsModelAVehicle(model) and not Citizen.InvokeNative(0x772A1969F649E902, GetHashKey(model)) then
        debugPrint("^1Model provided is not a vehicle or horse: " .. model)
        return false
    end

    --request
    TriggerServerEvent('txsv:req:vehicle:spawn:redm', model)
    return true
end

local gameSpawnReqHandler = IS_FIVEM and handleSpawnRequestFivem or handleSpawnRequestRedm

RegisterSecureNuiCallback('spawnVehicle', function(data, cb)
    if type(data) ~= 'table' or type(data.model) ~= 'string' then
        error("Invalid spawnVehicle NUI callback data")
    end
    if not IsModelValid(data.model) then
        debugPrint("^1Invalid vehicle/horse model requested: " .. data.model)
        return cb({ e = true })
    end

    local spawnReqDone = gameSpawnReqHandler(data.model)
    cb(spawnReqDone and {} or { e = true })
end)

RegisterSecureNuiCallback("deleteVehicle", function(data, cb)
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


RegisterSecureNuiCallback('fixVehicle', function(_, cb)
    local ped = PlayerPedId()
    local veh = GetVehiclePedIsIn(ped, false)
    if (veh == 0) and not IsPedOnMount(ped) then
        return cb({ e = true })
    end

    TriggerServerEvent('txsv:req:vehicle:fix')
    cb({})
end)


RegisterSecureNuiCallback('boostVehicle', function(_, cb)
    local ped = PlayerPedId()
    local veh = GetVehiclePedIsIn(ped, false)
    if IS_REDM and IsPedOnMount(ped) then
        veh = GetMount(ped)
    end
    if veh and veh > 0 then
        TriggerServerEvent('txsv:req:vehicle:boost')
        cb({})
    else
        cb({ e = true })
    end
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

local function boostVehicleFivem()
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
end

local function boostVehicleRedm()
    local ped = PlayerPedId()
    local horse = IsPedOnMount(ped) and GetMount(ped) or false
    if not horse then
        return sendSnackbarMessage('error', 'nui_menu.page_main.vehicle.boost.redm_not_mounted', true)
    end

    local boostedFlag = Citizen.InvokeNative(0x200373A8DF081F22, horse, 0)
    if boostedFlag then
        return sendSnackbarMessage('error', 'nui_menu.page_main.vehicle.boost.already_boosted', true)
    end

    local duration = 4000.0
    -- Inner/Outter Health
    Citizen.InvokeNative(0x4AF5A4C7B9157D14, horse, 0, duration, true) --EnableAttributeCoreOverpower
    Citizen.InvokeNative(0xF6A7C08DF2E28B28, horse, 0, duration, true) --EnableAttributeOverpower
    -- Inner/Outter Stamina
    Citizen.InvokeNative(0x4AF5A4C7B9157D14, horse, 1, duration, true) --EnableAttributeCoreOverpower
    Citizen.InvokeNative(0xF6A7C08DF2E28B28, horse, 1, duration, true) --EnableAttributeOverpower

    AnimpostfxPlay('PlayerOverpower')
    sendSnackbarMessage('success', 'nui_menu.page_main.vehicle.boost.success', true)
end

local boostVehicleFunc = IS_FIVEM and boostVehicleFivem or boostVehicleRedm
RegisterNetEvent('txcl:vehicle:boost', boostVehicleFunc)

-- Fix vehicle
RegisterNetEvent('txcl:vehicle:fix', function()
    local ped = PlayerPedId()
    local veh = GetVehiclePedIsIn(ped, false)
    if veh and veh > 0 then
        SetVehicleUndriveable(veh, false)
        SetVehicleFixed(veh)
        SetVehicleEngineOn(veh, true, false)
        SetVehicleDirtLevel(veh, 0.0)
        SetVehicleOnGroundProperly(veh)
    elseif IS_REDM and IsPedOnMount(ped) then
        local horse = GetMount(ped)
        ResurrectPed(horse)
        SetEntityHealth(horse, GetEntityMaxHealth(horse))
        Citizen.InvokeNative(0xC6258F41D86676E0, horse, 0, 100) -- SetAttributeCoreValue
        Citizen.InvokeNative(0xC6258F41D86676E0, horse, 1, 100) -- SetAttributeCoreValue
        Citizen.InvokeNative(0xC6258F41D86676E0, horse, 2, 100) -- SetAttributeCoreValue
    end
end)

-- Spawn vehicle - used in redm
RegisterNetEvent('txcl:vehicle:spawn:redm', function(model)
    if not IS_REDM then return end
    if type(model) ~= 'string' then return end

    -- check model
    local modelHash = GetHashKey(model)
    local isVehicle = IsModelAVehicle(model)
    local isHorse = Citizen.InvokeNative(0x772A1969F649E902, modelHash) --IsThisModelAHorse
    if not isVehicle and not isHorse then
        return debugPrint("^1Model provided is not a vehicle or horse: " .. model)
    end

    -- get player data
    local playerPed = PlayerPedId()
    local playerCoords = GetEntityCoords(playerPed)
    local playerHeading = GetEntityHeading(playerPed)
    local currentVeh = GetVehiclePedIsIn(playerPed, false)
    if IsPedOnMount(playerPed) then
        currentVeh = GetMount(playerPed)
    end
    local currentVehVelocity
    if currentVeh then
        currentVehVelocity = GetEntityVelocity(currentVeh)
        DeleteEntity(currentVeh)
    end

    -- request new model
    RequestModel(modelHash)
    while not HasModelLoaded(modelHash) do
        Wait(15)
    end

    -- spawn it
    local newVeh
    if isVehicle then
        newVeh = CreateVehicle(modelHash, playerCoords, playerHeading, true, false, false)
        SetPedIntoVehicle(playerPed, newVeh, -1)
        SetVehicleOnGroundProperly(newVeh)
    else
        newVeh = CreatePed(modelHash, playerCoords, playerHeading, true, false)
        -- Citizen.InvokeNative(0x77FF8D35EEC6BBC4, newVeh, 1, 0) --EquipMetaPedOutfitPreset
        Citizen.InvokeNative(0x283978A15512B2FE, newVeh, true) --SetRandomOutfitVariation
        Citizen.InvokeNative(0x028F76B6E78246EB, playerPed, newVeh, -1) --SetPedOntoMount
    end

    -- preserving speed, doesn't work well for horses
    if currentVehVelocity then
        SetEntityVelocity(newVeh, currentVehVelocity)
    end
    SetModelAsNoLongerNeeded(modelHash)
end)


-- Spawn vehicles, with support for entity lockdown - used in fivem
RegisterNetEvent('txcl:seatInVehicle', function(vehNetID, seat, oldVehVelocity)
    if type(vehNetID) ~= 'number' then return end
    if type(seat) ~= 'number' then return end

    local attemptsCounter = 0
    local attemptsLimit = 400 -- 400*5 = 2s
    while not NetworkDoesEntityExistWithNetworkId(vehNetID) and attemptsCounter < attemptsLimit do
        Wait(5)
    end
    if not NetworkDoesEntityExistWithNetworkId(vehNetID) then
        return sendSnackbarMessage('error', 'Failed to seat into vehicle (net=' .. vehNetID .. ')', false)
    end

    local veh = NetToVeh(vehNetID)
    if veh and veh > 0 then
        SetPedIntoVehicle(PlayerPedId(), veh, seat)
        if seat == -1 then
            SetVehicleEngineOn(veh, true, true, false)
            SetVehicleOnGroundProperly(veh)
            if type(oldVehVelocity) ~= 'vector3' then
                SetEntityVelocity(veh, oldVehVelocity)
            end
        end
    end
end)
