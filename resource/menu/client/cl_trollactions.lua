-- Prevent running if menu is disabled
if not TX_MENU_ENABLED then return end

-- =============================================
--  Troll action logic from the player modal is located here (callbacks, events)
-- =============================================

local EFFECT_TIME_MS = GetConvarInt('txAdmin-menuDrunkDuration', 30)*1000
local DRUNK_ANIM_SET = "move_m@drunk@verydrunk"

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
local function drunkThreadFivem()
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
            local isPedInVehicleAndDriving = (vehPedIsIn ~= 0) and (GetPedInVehicleSeat(vehPedIsIn, -1) == playerPed)

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

local REDM_DRUNK_FX = 'PlayerDrunkAberdeen'
local function drunkThreadRedm()
    debugPrint('Starting drunk effect')
    AnimpostfxPlay(REDM_DRUNK_FX)
    Citizen.InvokeNative(0x406CCF555B04FAD3, PlayerPedId(), 1, 1.0) --SetPedDrunkness
    Wait(EFFECT_TIME_MS)
    debugPrint('Cleaning up drunk effect')
    AnimpostfxStop(REDM_DRUNK_FX)
    Citizen.InvokeNative(0x406CCF555B04FAD3, PlayerPedId(), 1, 0.0) --SetPedDrunkness
end


--[[ Wild Attack command ]]
local attackAnimals
if IS_FIVEM then
    attackAnimals = {
        GetHashKey("a_c_chimp"),
        GetHashKey("a_c_rottweiler"),
        GetHashKey("a_c_coyote")
    }
else
    attackAnimals = {
        GetHashKey("a_c_wolf_small"),
        GetHashKey("a_c_bearblack_01"),
        GetHashKey("a_c_dogrufus_01")
    }
end
local animalGroupHash = GetHashKey("Animal")
local playerGroupHash = GetHashKey("PLAYER")

local function startWildAttack()
    -- Consts
    local playerPed = PlayerPedId()
    local animalHash = attackAnimals[math.random(#attackAnimals)]
    local coordsBehindPlayer = GetOffsetFromEntityInWorldCoords(playerPed, 100, -15.0, 0)
    local playerHeading = GetEntityHeading(playerPed)
    local belowGround, groundZ, vec3OnFloor = GetGroundZAndNormalFor_3dCoord(coordsBehindPlayer.x, coordsBehindPlayer.y, coordsBehindPlayer.z)

    -- Requesting model
    RequestModel(animalHash)
    while not HasModelLoaded(animalHash) do
        Wait(15)
    end

    -- Creating Animal
    local animalPed
    if IS_FIVEM then
        animalPed = CreatePed(1, animalHash, coordsBehindPlayer.x, coordsBehindPlayer.y, groundZ, playerHeading, true, false)
    else
        animalPed = CreatePed(animalHash, coordsBehindPlayer.x, coordsBehindPlayer.y, groundZ, playerHeading, true, false)
        Citizen.InvokeNative(0x77FF8D35EEC6BBC4, animalPed, 1, 0) --EquipMetaPedOutfitPreset
    end

    -- setting player as enemy
    SetPedFleeAttributes(animalPed, 0, 0)
    SetPedRelationshipGroupHash(animalPed, animalGroupHash)
    TaskSetBlockingOfNonTemporaryEvents(animalPed, true)
    TaskCombatHatedTargetsAroundPed(animalPed, 30.0, 0)
    ClearPedTasks(animalPed)
    TaskPutPedDirectlyIntoMelee(animalPed, playerPed, 0.0, -1.0, 0.0, 0)
    SetRelationshipBetweenGroups(5, animalGroupHash, playerGroupHash)
    SetRelationshipBetweenGroups(5, playerGroupHash, animalGroupHash)
    SetModelAsNoLongerNeeded(animalHash)
end
-- RegisterCommand('atk', startWildAttack)


--[[ Net Events ]]
RegisterNetEvent('txcl:setDrunk', function()
    if IS_FIVEM then
        drunkThreadFivem()
    else
        drunkThreadRedm()
    end
end)

RegisterNetEvent('txcl:setOnFire', function()
    debugPrint('Setting player on fire')
    local playerPed = PlayerPedId()
    StartEntityFire(playerPed)
end)

RegisterNetEvent('txcl:wildAttack', function()
    startWildAttack()
end)


--[[ NUI Callbacks ]]
RegisterSecureNuiCallback('drunkEffectPlayer', function(data, cb)
    TriggerServerEvent('txsv:req:troll:setDrunk', tonumber(data.id))
    cb({})
end)

RegisterSecureNuiCallback('setOnFire', function(data, cb)
    TriggerServerEvent('txsv:req:troll:setOnFire', tonumber(data.id))
    cb({})
end)

RegisterSecureNuiCallback('wildAttack', function(data, cb)
    TriggerServerEvent('txsv:req:troll:wildAttack', tonumber(data.id))
    cb({})
end)
