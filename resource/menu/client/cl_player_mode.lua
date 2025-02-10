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

-- Calculated in python using sklearn.linear_model.LinearRegression with the points:
-- H: 10, F: 20
-- H: 150, F: 250
local function getFallImpulse(H)
    local coefficient = 1.6428571428571428
    local intercept = 3.5714285714285836
    return coefficient * H + intercept
end

-- NOTE: this depends on toggleGodMode(false) running _first_ before disabling noclip
local function disableRagdollingWhileFall()
    CreateThread(function()
        -- Check if ped is too close to the ground
        local ped = PlayerPedId()
        local pedHeight = GetEntityHeightAboveGround(ped)
        if pedHeight == nil or pedHeight < 4.0 then
            debugPrint('Ped is too close to the ground, returning')
            return
        end

        -- Disable ragdolling
        local pid = PlayerId()
        SetEntityInvincible(ped, true)
        if IS_FIVEM then
            SetPlayerFallDistance(pid, 9000.0)
        else
            SetRagdollBlockingFlags(ped, (1 << 9)) --RBF_FALLING 
        end

        -- Fall from big heights take forever, so force the ped down
        -- Note, force is clamped to -250.0 by the engine
        -- Note2, this needs to be applied before the fall starts
        local downForce = getFallImpulse(pedHeight)
        ApplyForceToEntity(
            ped,
            3,                             --MaxForceRot2
            vector3(0.0, 0.0, -downForce), --force
            vector3(0.0, 0.0, 0.0),        --offset
            0,                             --boneIndex
            true,                          --isDirectionRel
            true,                          --ignoreUpVec
            true,                          --isForceRel
            false,                         --p12
            true                           --p13
        )
        debugPrint('Ped should fall, applying down force:', downForce)

        --Await for ped to start falling for up to 1 second
        --If it doesn't, asume that it is not going to fall and return
        local fallAwaitLimit = 1000
        local fallAwaitStep = 25
        local fallAwaitElapsed = 0
        while not IsPedFalling(ped) do
            if fallAwaitElapsed >= fallAwaitLimit then
                debugPrint('Ped did not fall, returning')
                SetEntityInvincible(ped, false)
                SetPlayerFallDistance(pid, -1)
                return
            end
            fallAwaitElapsed = fallAwaitElapsed + fallAwaitStep
            Wait(fallAwaitStep)
        end
        debugPrint('Ped is falling, disabling ragdolling')

        -- Wait until ped stops falling
        repeat
            Wait(50)
        until not IsPedFalling(ped)
        debugPrint('Ped stopped falling, re-enabling ragdolling')

        -- Re-enable ragdolling
        Wait(750) --Probably not needed, but just in case
        debugPrint('Re-enabling ragdolling')
        SetEntityInvincible(ped, false)
        if IS_FIVEM then
            SetPlayerFallDistance(pid, -1)
        else
            ClearRagdollBlockingFlags(ped, (1 << 9)) --RBF_FALLING 
        end
    end)
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
        if freecamVeh == 0 then
            disableRagdollingWhileFall()
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
        CreatePlayerModePtfxLoop(PlayerPedId(), true)
    end

    --FIXME: Refactor this file:
    -- * keep state of the current game mode in a var
    -- * when changing mode, disable the current mode
    -- * and only then enable the new mode
    -- * separate the noclip enable and disable functions
    -- * rename "freecam" to "noclip" in the code

    --NOTE: always do the toggleX(true) at the bottom to prevent
    --conflict with some other native like toggleGodMode(false) after toggleFreecam(true)
    --which disables the SetEntityInvincible(true)

    --FIXME: for now, always disable godmode before disabling noclip
    if mode == 'godmode' then
        toggleFreecam(false)
        toggleSuperJump(false)
        toggleGodMode(true)
    elseif mode == 'noclip' then
        toggleGodMode(false)
        toggleSuperJump(false)
        toggleFreecam(true)
    elseif mode == 'superjump' then
        toggleGodMode(false)
        toggleFreecam(false)
        toggleSuperJump(true)
    elseif mode == 'none' then
        toggleGodMode(false)
        toggleFreecam(false)
        toggleSuperJump(false)
    end
end)
