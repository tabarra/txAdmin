-- Prevent running if menu is disabled
if not TX_MENU_ENABLED then return end

-- ===============
--  This file contains the particle effects feature
-- that happens when a player switches mode (god, noclip, super jump, normal)
-- ===============
local PTFX_DICT, PTFX_ASSET, PTFX_SCALE, PTFX_DURATION, PTFX_AUDIONAME, PTFX_AUDIOREF, LOOP_AMOUNT, LOOP_DELAY
if IS_FIVEM then
    PTFX_DICT = 'core'
    PTFX_ASSET = 'ent_dst_elec_fire_sp'
    PTFX_SCALE = 1.75
    PTFX_DURATION = 1500
    PTFX_AUDIONAME = 'ent_amb_elec_crackle'
    PTFX_AUDIOREF = 0
    LOOP_AMOUNT = 7
    LOOP_DELAY = 75
else
    PTFX_DICT = 'core'
    PTFX_ASSET = 'fire_wrecked_hot_air_balloon'
    PTFX_SCALE = 1.5
    PTFX_DURATION = 1250
    PTFX_AUDIONAME = 'Man_On_Fire'
    PTFX_AUDIOREF = 'REKR_Dispute_Sounds'
    LOOP_AMOUNT = 1
    LOOP_DELAY = 0
end


local function playPtfxSoundFivem(index, tgtPedId, isSelf)
    -- -- Apparently we _need_ to network this, so disabling the sound if not self
    -- if not isSelf then return end

    PlaySoundFromEntity(
        -1,
        PTFX_AUDIONAME,
        tgtPedId,
        PTFX_AUDIOREF,
        false,
        0
    )
end

local function playPtfxSoundRedm(index, tgtPedId, isSelf)
    --FIXME: I gave up on making sound work in RedM, it's too much of a hassle

    -- -- Play only the first time
    -- if index ~= 1 then return end
    -- -- -- Apparently we _need_ to network this, so disabling the sound if not self
    -- -- if not isSelf then return end

    -- local loadAttempts = 1
    -- while PTFX_AUDIOREF ~= 0 and not PrepareSoundset(PTFX_AUDIOREF, 0) and loadAttempts <= 60 do
    --     loadAttempts = loadAttempts + 1
    --     Citizen.Wait(5)
    -- end

    -- PlaySoundFromEntityWithSet(
    --     -1,
    --     PTFX_AUDIONAME,
    --     tgtPedId,
    --     PTFX_AUDIOREF,
    --     false,
    --     0
    -- )
    -- -- PlaySoundFromEntity(
    -- --     PTFX_AUDIONAME,
    -- --     tgtPedId,
    -- --     PTFX_AUDIOREF,
    -- --     false,
    -- --     true,
    -- --     0
    -- -- )

    -- CreateThread(function()
    --     Wait(3000)
    --     ReleaseSoundset(audioRef)
    -- end)
end

local playPtfxSound = IS_FIVEM and playPtfxSoundFivem or playPtfxSoundRedm

-- Applies the particle effect to a ped
function CreatePlayerModePtfxLoop(tgtPedId, isSelf)
    CreateThread(function()
        if tgtPedId <= 0 or tgtPedId == nil then return end
        RequestNamedPtfxAsset(PTFX_DICT)

        -- Wait until it's done loading.
        while not HasNamedPtfxAssetLoaded(PTFX_DICT) do
            Wait(5)
        end

        local particleTbl = {}
        for i = 0, LOOP_AMOUNT do
            UseParticleFxAsset(PTFX_DICT)
            playPtfxSound(i, tgtPedId, isSelf)
            local partiResult = StartParticleFxLoopedOnEntity(
                PTFX_ASSET,
                tgtPedId,
                0.0, 0.0, 0.0,      -- offset
                0.0, 0.0, 0.0,      -- rot
                PTFX_SCALE,
                false, false, false -- axis
            )
            particleTbl[#particleTbl + 1] = partiResult
            Wait(LOOP_DELAY)
        end

        Wait(PTFX_DURATION)
        for _, parti in ipairs(particleTbl) do
            StopParticleFxLooped(parti, true)
        end
        RemoveNamedPtfxAsset(PTFX_DICT)
    end)
end

-- DEBUG Test Command
-- RegisterCommand('ptfx', function()
--     CreateThread(function()
--         Wait(500)
--         while true do
--             -- get nearby players to receive the ptfx sync event
--             local players = GetActivePlayers()
--             local nearbyPlayers = {}
--             for _, player in ipairs(players) do
--                 nearbyPlayers[#nearbyPlayers + 1] = GetPlayerServerId(player)
--             end

--             TriggerServerEvent('txsv:req:changePlayerMode', 'none', nearbyPlayers)
--             Wait(5000)
--         end
--     end)
-- end)

RegisterNetEvent('txcl:showPtfx', function(tgtSrc)
    debugPrint('Syncing particle effect for target netId', tgtSrc)
    local tgtPlayer = GetPlayerFromServerId(tgtSrc)
    if tgtPlayer == -1 then return end
    CreatePlayerModePtfxLoop(GetPlayerPed(tgtPlayer), false)
end)
