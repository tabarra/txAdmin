-- Prevent running if menu is disabled
if not TX_MENU_ENABLED then return end

-- ===============
--  This file contains functionality purely related
--  to player modes (noclip, godmode, super jump)
-- ===============

local noClipEnabled = false
local superJumpEnabled = false
local moveRateOverride = IS_FIVEM and 1.75 or 1.15
local function toggleSuperJump(enabled)
    superJumpEnabled = enabled
    if enabled then
        sendPersistentAlert('superJumpEnabled', 'info', 'nui_menu.page_main.player_mode.superjump.success', true)
        CreateThread(function()
            local Wait = Wait
            local pid = PlayerId()
            local ped = PlayerPedId()
            -- loop to keep player fast
            local frameCounter = 0
            while superJumpEnabled do
                frameCounter = frameCounter + 1
                if frameCounter > 200 then
                    RestorePlayerStamina(pid, 100.0)
                    ped = PlayerPedId()
                    frameCounter = 0
                end
                SetPedMoveRateOverride(ped, moveRateOverride)
                SetSuperJumpThisFrame(pid)
                Wait(0)
            end
        end)
    else
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
local isVehAHorse = false
local setLocallyInvisibleFunc = IS_FIVEM and SetEntityLocallyInvisible or SetPlayerInvisibleLocally
local function toggleFreecam(enabled)
    noClipEnabled = enabled
    local ped = PlayerPedId()
    SetEntityVisible(ped, not enabled)
    SetEntityInvincible(ped, enabled)
    FreezeEntityPosition(ped, enabled)

    if enabled then
        freecamVeh = GetVehiclePedIsIn(ped, false)
        if IsPedOnMount(ped) then
            isVehAHorse = true
            freecamVeh = GetMount(ped)
        end
        if freecamVeh > 0 then
            NetworkSetEntityInvisibleToNetwork(freecamVeh, true)
            SetEntityCollision(freecamVeh, false, false)
            SetEntityVisible(freecamVeh, false)
            FreezeEntityPosition(freecamVeh, true)
            if not isVehAHorse then
                SetVehicleCanBreak(freecamVeh, false)
                SetVehicleWheelsCanBreak(freecamVeh, false)
            end
        end
    end

    local function enableNoClip()
        lastTpCoords = GetEntityCoords(ped)

        SetFreecamActive(true)
        StartFreecamThread()

        Citizen.CreateThread(function()
            while IsFreecamActive() do
                setLocallyInvisibleFunc(ped, true)
                if freecamVeh > 0 then
                    if DoesEntityExist(freecamVeh) then
                        setLocallyInvisibleFunc(freecamVeh, true) -- only works for players in RedM, but to prevent errors.
                    else
                        freecamVeh = 0
                    end
                end
                Wait(0)
            end

            if freecamVeh > 0 and DoesEntityExist(freecamVeh) then
                local coords = GetEntityCoords(ped)
                NetworkSetEntityInvisibleToNetwork(freecamVeh, false)
                SetEntityCoords(freecamVeh, coords[1], coords[2], coords[3], false, false, false, false)
                SetVehicleOnGroundProperly(freecamVeh)
                SetEntityCollision(freecamVeh, true, true)
                SetEntityVisible(freecamVeh, true)
                FreezeEntityPosition(freecamVeh, false)

                if isVehAHorse then
                    Citizen.InvokeNative(0x028F76B6E78246EB, ped, freecamVeh, -1) --SetPedOntoMount
                else
                    SetEntityAlpha(freecamVeh, 125)
                    SetPedIntoVehicle(ped, freecamVeh, -1)
                    local persistVeh = freecamVeh --since freecamVeh is erased down below
                    CreateThread(function()
                        Wait(2000)
                        ResetEntityAlpha(persistVeh)
                        SetVehicleCanBreak(persistVeh, true)
                        SetVehicleWheelsCanBreak(persistVeh, true)
                    end)
                end
            end
            freecamVeh = 0
        end)
    end

    local function disableNoClip()
        SetFreecamActive(false)
        if IS_FIVEM then
            SetGameplayCamRelativeHeading(0)
        else
            Citizen.InvokeNative(0x14F3947318CA8AD2, 0.0, 0.0) -- SetThirdPersonCamRelativeHeadingLimitsThisUpdate
        end
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


local PTFX_DICT, PTFX_ASSET, LOOP_AMOUNT, PTFX_DURATION
if IS_FIVEM then
    PTFX_DICT = 'core'
    PTFX_ASSET = 'ent_dst_elec_fire_sp'
    LOOP_AMOUNT = 25
    PTFX_DURATION = 1000
else
    PTFX_DICT = 'core'
    PTFX_ASSET = 'fire_wrecked_hot_air_balloon'
    LOOP_AMOUNT = 10
    PTFX_DURATION = 850
end

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

        for i = 0, LOOP_AMOUNT do
            UseParticleFxAsset(PTFX_DICT)
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

RegisterNetEvent('txcl:showPtfx', function(tgtSrc)
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

    TriggerServerEvent('txsv:req:changePlayerMode', mode, nearbyPlayers)
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
RegisterSecureNuiCallback('playerModeChanged', function(mode, cb)
    askChangePlayerMode(mode)
    cb({})
end)

-- [[ Player mode changed cb event ]]
RegisterNetEvent('txcl:setPlayerMode', function(mode, ptfx)
    if ptfx then
        createPlayerModePtfxLoop(PlayerPedId())
    end

    --NOTE: always do the toggleX(true) at the bottom to prevent
    --conflict with some other native like toggleGodMode(false) after toggleFreecam(true)
    --which disables the SetEntityInvincible(true)
    if mode == 'godmode' then
        toggleFreecam(false)
        toggleSuperJump(false)
        toggleGodMode(true)
    elseif mode == 'noclip' then
        toggleGodMode(false)
        toggleSuperJump(false)
        toggleFreecam(true)
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
