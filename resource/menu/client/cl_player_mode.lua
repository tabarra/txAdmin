-- ===============
--  This file contains functionality purely related
--  to player modes (noclip, godmode)
-- ===============
if (GetConvar('txAdmin-menuEnabled', 'false') ~= 'true') then
    return
end

local noClipEnabled = false
local superJumpEnabled = false

local function toggleSuperJump(enabled)
    superJumpEnabled = enabled
    if enabled then
        sendPersistentAlert('superJumpEnabled', 'info', 'nui_menu.page_main.player_mode.superjump.success', true)
        CreateThread(function()
            local Wait = Wait
            local pid = PlayerId()
            SetRunSprintMultiplierForPlayer(pid, 1.49)
            local frameCounter = 0
            while superJumpEnabled do
                frameCounter = frameCounter + 1
                if frameCounter > 250 then
                    RestorePlayerStamina(pid, 100.0)
                    frameCounter = 0
                end
                SetSuperJumpThisFrame(pid)
                Wait(0)
            end
          end)
    else
        local pid = PlayerId()
        SetRunSprintMultiplierForPlayer(pid, 1.0)
        clearPersistentAlert('superJumpEnabled')
    end
end


local function toggleGodMode(enabled)
    if enabled then
        sendPersistentAlert('godModeEnabled', 'info', 'nui_menu.page_main.player_mode.godmode.success', true)
    else
        clearPersistentAlert('godModeEnabled')
    end
    SetEntityInvincible(PlayerPedId(), enabled)
end

local freecamVeh = 0
local function toggleFreecam(enabled)
    noClipEnabled = enabled
    local ped = PlayerPedId()
    SetEntityVisible(ped, not enabled)
    SetEntityInvincible(ped, enabled)
    FreezeEntityPosition(ped, enabled)

    if enabled then
        freecamVeh = GetVehiclePedIsIn(ped, false)
        if freecamVeh > 0 then
            NetworkSetEntityInvisibleToNetwork(freecamVeh, true)
            SetEntityCollision(freecamVeh, false, false)
        end
    end

    local function enableNoClip()
        lastTpCoords = GetEntityCoords(ped)

        SetFreecamActive(true)
        StartFreecamThread()

        Citizen.CreateThread(function()
            while IsFreecamActive() do
                SetEntityLocallyInvisible(ped)
                if freecamVeh > 0 then
                    if DoesEntityExist(freecamVeh) then
                        SetEntityLocallyInvisible(freecamVeh)
                    else
                        freecamVeh = 0
                    end
                end
                Wait(0)
            end

            if not DoesEntityExist(freecamVeh) then
                freecamVeh = 0
            end
            if freecamVeh > 0 then
                local coords = GetEntityCoords(ped)
                NetworkSetEntityInvisibleToNetwork(freecamVeh, false)
                SetEntityCollision(freecamVeh, true, true)
                SetEntityCoords(freecamVeh, coords[1], coords[2], coords[3])
                SetPedIntoVehicle(ped, freecamVeh, -1)
                freecamVeh = 0
            end
        end)
    end

    local function disableNoClip()
        SetFreecamActive(false)
        SetGameplayCamRelativeHeading(0)
    end

    if not IsFreecamActive() and enabled then
        sendPersistentAlert('noClipEnabled', 'info', 'nui_menu.page_main.player_mode.noclip.success', true)
        enableNoClip()
    end

    if IsFreecamActive() and not enabled then
        clearPersistentAlert('noClipEnabled')
        disableNoClip()
    end
end


local PTFX_ASSET = 'ent_dst_elec_fire_sp'
local PTFX_DICT = 'core'
local LOOP_AMOUNT = 25
local PTFX_DURATION = 1000

-- Applies the particle effect to a ped
local function createPlayerModePtfxLoop(tgtPedId)
    CreateThread(function()
        if tgtPedId <= 0 or tgtPedId == nil then return end
        RequestNamedPtfxAsset(PTFX_DICT)

        -- Wait until it's done loading.
        while not HasNamedPtfxAssetLoaded(PTFX_DICT) do
            Wait(0)
        end

        local particleTbl = {}

        for i=0, LOOP_AMOUNT do
            UseParticleFxAssetNextCall(PTFX_DICT)
            local partiResult = StartParticleFxLoopedOnEntity(PTFX_ASSET, tgtPedId, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.5, false, false, false)
            particleTbl[#particleTbl + 1] = partiResult
            Wait(0)
        end

        Wait(PTFX_DURATION)
        for _, parti in ipairs(particleTbl) do
            StopParticleFxLooped(parti, true)
        end
    end)
end

RegisterNetEvent('txcl:syncPtfxEffect', function(tgtSrc)
    debugPrint('Syncing particle effect for target netId')
    local tgtPlayer = GetPlayerFromServerId(tgtSrc)
    if tgtPlayer == -1 then return end
    createPlayerModePtfxLoop(GetPlayerPed(tgtPlayer))
end)

-- Ask server for playermode change and sends nearby playerlist
local function askChangePlayerMode(mode)
    debugPrint("Requesting player mode change to " .. mode)

    -- get nearby players to receive the ptfx sync event
    local players = GetActivePlayers()
    local nearbyPlayers = {}
    for _, player in ipairs(players) do
        nearbyPlayers[#nearbyPlayers + 1] = GetPlayerServerId(player)
    end

    TriggerServerEvent('txAdmin:menu:playerModeChanged', mode, nearbyPlayers)
end

-- NoClip toggle keybind
RegisterCommand('txAdmin:menu:noClipToggle', function()
    if not menuIsAccessible then return end
    if not DoesPlayerHavePerm(menuPermissions, 'players.playermode') then
        return sendSnackbarMessage('error', 'nui_menu.misc.no_perms', true)
    end
    askChangePlayerMode(noClipEnabled and 'none' or 'noclip')
end)

-- Menu callback to change the player mode
RegisterNUICallback('playerModeChanged', function(mode, cb)
    askChangePlayerMode(mode)
    cb({})
end)

-- [[ Player mode changed cb event ]]
RegisterNetEvent('txAdmin:menu:playerModeChanged', function(mode, ptfx)
    if ptfx then 
        createPlayerModePtfxLoop(PlayerPedId())
    end

    if mode == 'godmode' then
        toggleFreecam(false)
        toggleGodMode(true)
        toggleSuperJump(false)
    elseif mode == 'noclip' then
        toggleFreecam(true)
        toggleGodMode(false)
        toggleSuperJump(false)
    elseif mode == 'superjump' then
        toggleFreecam(false)
        toggleGodMode(false)
        toggleSuperJump(true)
    elseif mode == 'none' then
        toggleFreecam(false)
        toggleGodMode(false)
        toggleSuperJump(false)
    end
end)

