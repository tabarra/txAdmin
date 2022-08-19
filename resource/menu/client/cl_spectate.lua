-- =============================================
--  Contains all spectate related logic
-- =============================================
if (GetConvar('txAdmin-menuEnabled', 'false') ~= 'true') then
    return
end
-- Last spectate location stored in a vec3
local lastSpectateLocation
-- Spectate mode
local isSpectateEnabled = false
-- Spectated ped
local storedTargetPed
-- Spectated player's client ID
local storedTargetPlayerId
-- Spectated players associated GameTag
local storedGameTag


RegisterNUICallback('spectatePlayer', function(data, cb)
    TriggerServerEvent('txAdmin:menu:spectatePlayer', tonumber(data.id))
    cb({})
end)

local function InstructionalButton(controlButton, text)
    ScaleformMovieMethodAddParamPlayerNameString(controlButton)
    BeginTextCommandScaleformString("STRING")
    AddTextComponentScaleform(text)
    EndTextCommandScaleformString()
end

local function createScaleformThread()
    CreateThread(function()
        -- yay, scaleforms
        local scaleform = RequestScaleformMovie("instructional_buttons")
        while not HasScaleformMovieLoaded(scaleform) do
            Wait(1)
        end
        PushScaleformMovieFunction(scaleform, "CLEAR_ALL")
        PopScaleformMovieFunctionVoid()

        PushScaleformMovieFunction(scaleform, "SET_CLEAR_SPACE")
        PushScaleformMovieFunctionParameterInt(200)
        PopScaleformMovieFunctionVoid()

        PushScaleformMovieFunction(scaleform, "SET_DATA_SLOT")
        PushScaleformMovieFunctionParameterInt(1)
        InstructionalButton(GetControlInstructionalButton(1, 194), "Exit Spectate Mode")
        PopScaleformMovieFunctionVoid()


        PushScaleformMovieFunction(scaleform, "DRAW_INSTRUCTIONAL_BUTTONS")
        PopScaleformMovieFunctionVoid()

        PushScaleformMovieFunction(scaleform, "SET_BACKGROUND_COLOUR")
        PushScaleformMovieFunctionParameterInt(0)
        PushScaleformMovieFunctionParameterInt(0)
        PushScaleformMovieFunctionParameterInt(0)
        PushScaleformMovieFunctionParameterInt(80)
        PopScaleformMovieFunctionVoid()

        while isSpectateEnabled do
            DrawScaleformMovieFullscreen(scaleform, 255, 255, 255, 255, 0)
            Wait(0)
        end
        SetScaleformMovieAsNoLongerNeeded()
    end)
end

local function calculateSpectatorCoords(coords)
    return vec3(coords[1], coords[2], coords[3] - 15.0)
end

--- Called every 50 frames in SpectateMode to determine whether or not to recreate the GamerTag
local function createGamerTagInfo()
    if storedGameTag and IsMpGamerTagActive(storedGameTag) then return end
    local nameTag = ('[%d] %s'):format(GetPlayerServerId(storedTargetPlayerId), GetPlayerName(storedTargetPlayerId))
    storedGameTag = CreateFakeMpGamerTag(storedTargetPed, nameTag, false, false, '', 0, 0, 0, 0)
    SetMpGamerTagVisibility(storedGameTag, 2, 1)  --set the visibility of component 2(healthArmour) to true
    SetMpGamerTagAlpha(storedGameTag, 2, 255) --set the alpha of component 2(healthArmour) to 255
    SetMpGamerTagHealthBarColor(storedGameTag, 129) --set component 2(healthArmour) color to 129(HUD_COLOUR_YOGA)
    SetMpGamerTagVisibility(storedGameTag, 4, NetworkIsPlayerTalking(i))
    --debugPrint(('Created gamer tag for ped (%s), TargetPlayerID (%s)'):format(storedTargetPlayerId, storedTargetPlayerId))
end

--- Called to cleanup Gamer Tag's once spectate mode is disabled
local function clearGamerTagInfo()
    if not storedGameTag then return end
    RemoveMpGamerTag(storedGameTag)
    storedGameTag = nil
end

--- Will freeze the player and set the entity to invisible
--- @param bool boolean - Whether we should prepare or cleanup
local function preparePlayerForSpec(bool)
    local playerPed = PlayerPedId()
    FreezeEntityPosition(playerPed, bool)
    SetEntityVisible(playerPed, not bool, 0)
end

local function createSpectatorTeleportThread()
    debugPrint('Starting teleporting follower thread')
    CreateThread(function()
        while isSpectateEnabled do
            Wait(500)

            -- Check if ped still exists
            if not DoesEntityExist(storedTargetPed) then
                local _ped = GetPlayerPed(storedTargetPlayerId)
                if _ped > 0 then
                    if _ped ~= storedTargetPed then
                        debugPrint(("Spectated player (%s) changed ped to %s"):format(storedTargetPlayerId, _ped))
                        storedTargetPed = _ped
                    end
                    storedTargetPed = _ped
                else
                    debugPrint(("Spectated player (%s) no longer exists, ending spectate..."):format(storedTargetPlayerId))
                    toggleSpectate(storedTargetPed, storedTargetPlayerId)
                    break
                end
            end

            -- Update Teleport
            local newSpectateCoords = calculateSpectatorCoords(GetEntityCoords(storedTargetPed))
            SetEntityCoords(PlayerPedId(), newSpectateCoords.x, newSpectateCoords.y, newSpectateCoords.z, 0, 0, 0, false)
        end
    end)
end

--- Will toggle spectate for a targeted ped
--- @param targetPed nil|number - The target ped when toggling on, can be nil when toggling off
local function toggleSpectate(targetPed, targetPlayerId)
    local playerPed = PlayerPedId()

    if isSpectateEnabled then
        isSpectateEnabled = false

        if not lastSpectateLocation then
            error('Last location previous to spectate was not stored properly')
        end

        if not storedTargetPed then
            error('Target ped was not stored to unspectate')
        end

        DoScreenFadeOut(500)
        while not IsScreenFadedOut() do Wait(0) end

        RequestCollisionAtCoord(lastSpectateLocation.x, lastSpectateLocation.y, lastSpectateLocation.z)
        SetEntityCoords(playerPed, lastSpectateLocation.x, lastSpectateLocation.y, lastSpectateLocation.z)
        -- The player is still frozen while we wait for collisions to load
        while not HasCollisionLoadedAroundEntity(playerPed) do
            Wait(5)
        end
        debugPrint('Collisions loaded around player')

        preparePlayerForSpec(false)
        debugPrint('Unfreezing current player')

        NetworkSetInSpectatorMode(false, storedTargetPed)
        debugPrint(('Set spectate to false for targetPed (%s)'):format(storedTargetPed))
        clearGamerTagInfo()
        DoScreenFadeIn(500)

        storedTargetPed = nil
    else
        storedTargetPed = targetPed
        storedTargetPlayerId = targetPlayerId
        local targetCoords = GetEntityCoords(targetPed)
        debugPrint(('Targets coords = x: %f, y: %f, z: %f'):format(targetCoords.x, targetCoords.y, targetCoords.z))

        RequestCollisionAtCoord(targetCoords.x, targetCoords.y, targetCoords.z)
        while not HasCollisionLoadedAroundEntity(targetPed) do
            Wait(5)
        end
        debugPrint(('Collisions loaded around TargetPed (%s)'):format(targetPed))

        NetworkSetInSpectatorMode(true, targetPed)
        DoScreenFadeIn(500)
        debugPrint(('Now spectating TargetPed (%s)'):format(targetPed))
        isSpectateEnabled = true
        createSpectatorTeleportThread()
        createScaleformThread()
    end
end

RegisterCommand('txAdmin:menu:endSpectate', function()
    if isSpectateEnabled then
        toggleSpectate(storedTargetPed)
        preparePlayerForSpec(false)
        TriggerServerEvent('txAdmin:menu:endSpectate')
    end
end)

-- Run whenever we failed to resolve a target player to spectate
local function cleanupFailedResolve()
    local playerPed = PlayerPedId()

    RequestCollisionAtCoord(lastSpectateLocation.x, lastSpectateLocation.y, lastSpectateLocation.z)
    SetEntityCoords(playerPed, lastSpectateLocation.x, lastSpectateLocation.y, lastSpectateLocation.z)
    -- The player is still frozen while we wait for collisions to load
    while not HasCollisionLoadedAroundEntity(playerPed) do
        Wait(5)
    end
    preparePlayerForSpec(false)

    DoScreenFadeIn(500)

    sendSnackbarMessage('error', 'nui_menu.player_modal.actions.interaction.notifications.spectate_failed', true)
end

-- Client-side event handler for an authorized spectate request
RegisterNetEvent('txAdmin:menu:specPlayerResp', function(targetServerId, coords)
    local spectatorPed = PlayerPedId()
    lastSpectateLocation = GetEntityCoords(spectatorPed)

    local targetPlayerId = GetPlayerFromServerId(targetServerId)
    if targetPlayerId == PlayerId() then
        return sendSnackbarMessage('error', 'nui_menu.player_modal.actions.interaction.notifications.spectate_yourself', true)
    end

    DoScreenFadeOut(500)
    while not IsScreenFadedOut() do Wait(0) end

    local tpCoords = calculateSpectatorCoords(coords)
    SetEntityCoords(spectatorPed, tpCoords.x, tpCoords.y, tpCoords.z, 0, 0, 0, false)
    preparePlayerForSpec(true)

    --- We need to wait to make sure that the player is actually available once we teleport
    --- this can take some time so we do this. Automatically breaks if a player isn't resolved
    --- within 5 seconds.
    local resolvePlayerAttempts = 0
    local resolvePlayerFailed

    repeat
        if resolvePlayerAttempts > 100 then
            resolvePlayerFailed = true
            break;
        end
        Wait(50)
        debugPrint('Waiting for player to resolve')
        targetPlayerId = GetPlayerFromServerId(targetServerId)
        resolvePlayerAttempts = resolvePlayerAttempts + 1
    until (GetPlayerPed(targetPlayerId) > 0) and targetPlayerId ~= -1

    if resolvePlayerFailed then
        return cleanupFailedResolve()
    end

    debugPrint('Target Ped successfully found!')
    toggleSpectate(GetPlayerPed(targetPlayerId), targetPlayerId)
end)

CreateThread(function()
    while true do
        if isSpectateEnabled then
            createGamerTagInfo()
        else
            clearGamerTagInfo()
        end
        Wait(50)
    end
end)
