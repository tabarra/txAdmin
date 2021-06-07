local EFFECT_TIME_MS = GetConvarInt('txAdminMenu-trollDuration', 30000)
local DRUNK_ANIM_SET = "move_m@drunk@verydrunk"
local WEED_ANIM_SET = "move_m@drunk@moderatedrunk"

local DRUNK_DRIVING_EFFECTS = {
    1, -- brake
    7, --turn left + accelerate
    8, -- turn right + accelerate
    23, -- accelerate
    4, -- turn left 90 + braking
    5, -- turn right 90 + braking
}

local function getRandomDrunkCarTask()
    math.randomseed(GetGameTimer())

    return DRUNK_DRIVING_EFFECTS[math.random(#DRUNK_DRIVING_EFFECTS)]
end

-- NOTE: We might want to check if a player already has an effect
local function drunkThread()
    local playerPed = PlayerPedId()
    local isDrunk = true

    debugPrint('Starting drunk effect')
    RequestAnimSet(DRUNK_ANIM_SET)
    while not HasAnimSetLoaded(DRUNK_ANIM_SET) do
        Wait(5)
    end

    SetPedMovementClipset(playerPed, DRUNK_ANIM_SET)
    ShakeGameplayCam("DRUNK_SHAKE", 3.0)
    SetPedIsDrunk(playerPed, true)
    SetTransitionTimecycleModifier("spectator5", 10.00)

    CreateThread(function()
        while isDrunk do
            local vehPedIsIn = GetVehiclePedIsIn(playerPed)
            local isPedInVehicleAndDriving = GetVehiclePedIsIn(playerPed,false) and (GetPedInVehicleSeat(vehPedIsIn, -1) == playerPed)

            if isPedInVehicleAndDriving then
                local randomTask = getRandomDrunkCarTask()
                debugPrint('Dispatching random car tasks: ' .. randomTask)
                TaskVehicleTempAction(playerPed, vehPedIsIn, randomTask, 500)
            end

            Wait(5000)
        end
    end)

    Wait(EFFECT_TIME_MS)
    debugPrint('Cleaning up drunk effect')
    isDrunk = false
    SetTransitionTimecycleModifier("default", 10.00)
    StopGameplayCamShaking(true)
    ResetPedMovementClipset(playerPed)
    RemoveAnimSet(DRUNK_ANIM_SET)
end

local function weedEffect()
    debugPrint('Starting weed effect')
    RequestAnimSet(WEED_ANIM_SET)
    while not HasAnimSetLoaded(WEED_ANIM_SET) do
        Wait(5)
    end

    SetPedMovementClipset(playerPed, WEED_ANIM_SET)
    ShakeGameplayCam("DRUNK_SHAKE", 1.0)
    SetTransitionTimecycleModifier("spectator5", 10.00)

    Wait(EFFECT_TIME_MS)

    debugPrint('Cleaning up weed effect')
    SetTransitionTimecycleModifier("default", 10.00)
    StopGameplayCamShaking(true)
    ResetPedMovementClipset(playerPed)
    RemoveAnimSet(WEED_ANIM_SET)
end

local mountainLionHash = 307287994

local animalGroupHash = GetHashKey("Animal")

local playerGroupHash = GetHashKey("PLAYER")

-- TODO: This logic needs to be taken a looken at
-- Whenever the lion ped spawns all it does is just flee, no idea why.
local function startWildAttack()
    local playerPed = PlayerPedId()

    local coordsBehindPlayer = GetOffsetFromEntityInWorldCoords(playerPed, 0, -25.0, 0)

    local playerHeading = GetEntityHeading(playerPed)

    local belowGround, groundZ, vec3OnFloor = GetGroundZAndNormalFor_3dCoord(coordsBehindPlayer.x, coordsBehindPlayer.y, coordsBehindPlayer.z)

    debugPrint(groundZ)

    RequestModel(mountainLionHash)
    while not HasModelLoaded(mountainLionHash) do
        Wait(5)
    end

    SetModelAsNoLongerNeeded(mountainLionHash)

    local lionPed = CreatePed(1, mountainLionHash, coordsBehindPlayer.x, coordsBehindPlayer.y, groundZ, playerHeading, true, false)
    SetPedFleeAttributes(lionPed, 0, 0)
    SetPedRelationshipGroupHash(lionPed, animalGroupHash)
    TaskSetBlockingOfNonTemporaryEvents(lionPed, true)
    TaskCombatHatedTargetsAroundPed(lionPed, 30.0, 0)
    ClearPedTasks(lionPed)

    TaskPutPedDirectlyIntoMelee(lionPed, playerPed, 0.0, -1.0, 0.0, 0)

    SetRelationshipBetweenGroups(5, animalGroupHash, playerGroupHash)
    SetRelationshipBetweenGroups(5, playerGroupHash, animalGroupHash)
end

--[[
 Net Events
]]
RegisterNetEvent('txAdmin:menu:weedEffect', weedEffect)

RegisterNetEvent('txAdmin:menu:drunkEffect', drunkThread)

RegisterNetEvent('txAdmin:menu:setOnFire', function()
    debugPrint('Setting player on fire')
    local playerPed = PlayerPedId()
    StartEntityFire(playerPed)
end)

RegisterNetEvent('txAdmin:menu:wildAttack', function()
    startWildAttack()
end)

--RegisterCommand('wildAttack', function()
--    startWildAttack()
--end)
--[[
 NUI Callbacks
]]
RegisterNUICallback('weedEffectPlayer', function(data, cb)
    TriggerServerEvent('txAdmin:menu:weedEffectPlayer', tonumber(data.id))
    cb({})
end)

RegisterNUICallback('drunkEffectPlayer', function(data, cb)
    TriggerServerEvent('txAdmin:menu:drunkEffectPlayer', tonumber(data.id))
    cb({})
end)

RegisterNUICallback('wildAttack', function(data, cb)
    TriggerServerEvent('txAdmin:menu:wildAttack', tonumber(data.id))
    cb({})
end)

RegisterNUICallback('setOnFire', function(data, cb)
    TriggerServerEvent('txAdmin:menu:setOnFire', tonumber(data.id))
    cb({})
end)