-- =============================================
--  Contains all spectate related logic
-- =============================================
if (GetConvar('txAdmin-menuEnabled', 'false') ~= 'true') then
    return
end

-- Last spectate location stored in a vec3
local spectatorReturnCoords
-- Spectate mode
local isSpectateEnabled = false
-- Whether should we lock the camera to the target ped
local isInTransitionState = false

-- Spectated ped
local storedTargetPed
-- Spectated player's client ID
local storedTargetPlayerId
-- Spectated players associated server id
local storedTargetServerId
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

--- Creates and draws the instructional scaleform
--- NOTE: online JOAAT will not work, need to use the implementation
--- found in fivem/ext/sdk/resources/sdk-root/shell/src/utils/joaat.ts
local function createScaleformThread()
    CreateThread(function()
        local scaleform = RequestScaleformMovie("instructional_buttons")
        while not HasScaleformMovieLoaded(scaleform) do
            Wait(1)
        end
        PushScaleformMovieFunction(scaleform, "CLEAR_ALL")
        PopScaleformMovieFunctionVoid()

        PushScaleformMovieFunction(scaleform, "SET_CLEAR_SPACE")
        PushScaleformMovieFunctionParameterInt(200)
        PopScaleformMovieFunctionVoid()

        -- Next player button - txAdmin:menu:specNextPlayer
        PushScaleformMovieFunction(scaleform, "SET_DATA_SLOT")
        PushScaleformMovieFunctionParameterInt(2)
        InstructionalButton('~INPUT_698AE6AF~', "Next Player")
        PopScaleformMovieFunctionVoid()

        -- Previous player button - txAdmin:menu:specPrevPlayer
        PushScaleformMovieFunction(scaleform, "SET_DATA_SLOT")
        PushScaleformMovieFunctionParameterInt(1)
        InstructionalButton('~INPUT_5E76B036~', "Previous Player")
        PopScaleformMovieFunctionVoid()

        -- Exit spectate button - txAdmin:menu:endSpectate
        PushScaleformMovieFunction(scaleform, "SET_DATA_SLOT")
        PushScaleformMovieFunctionParameterInt(0)
        InstructionalButton('~INPUT_417C207D~', "Exit Spectate")
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
    return vec3(coords.x, coords.y, coords.z - 15.0)
end

--- Called every 50 frames in SpectateMode to determine whether or not to recreate the GamerTag
local function createGamerTagInfo()
    if not isInTransitionState then
        local nameTag = ('[%d] %s'):format(GetPlayerServerId(storedTargetPlayerId), GetPlayerName(storedTargetPlayerId))
        storedGameTag = CreateFakeMpGamerTag(storedTargetPed, nameTag, false, false, '', 0, 0, 0, 0)
    end
    SetMpGamerTagVisibility(storedGameTag, 2, 1)  --set the visibility of component 2(healthArmour) to true
    SetMpGamerTagAlpha(storedGameTag, 2, 255) --set the alpha of component 2(healthArmour) to 255
    SetMpGamerTagHealthBarColor(storedGameTag, 129) --set component 2(healthArmour) color to 129(HUD_COLOUR_YOGA)
    SetMpGamerTagAlpha(storedGameTag, 4, 255) --set the alpha of component 1(name) to 255
    SetMpGamerTagColour(storedGameTag, 4, 66)
    SetMpGamerTagVisibility(storedGameTag, 4, NetworkIsPlayerTalking(storedTargetPlayerId))
    --debugPrint(('Created gamer tag for ped (%s), TargetPlayerID (%s)'):format(storedTargetPed, storedTargetPlayerId))
end

--- Called to cleanup Gamer Tag's once spectate mode is disabled
local function clearGamerTagInfo()
    if not storedGameTag then return end
    RemoveMpGamerTag(storedGameTag)
    storedGameTag = nil
end

--- Starts the gamer tag thread
local function createSpectatorGamerTagThread()
    debugPrint('Starting gamer tag follower thread')
    CreateThread(function()
        while isSpectateEnabled and not isInTransitionState do
            createGamerTagInfo()
            Wait(50)
        end
        clearGamerTagInfo()
    end)
end

--- Will freeze the player and set the entity to invisible
--- @param bool boolean - Whether we should prepare or cleanup
local function prepareSpectatorPed(bool)
    local playerPed = PlayerPedId()
    FreezeEntityPosition(playerPed, bool)
    SetEntityVisible(playerPed, not bool, 0)
end

--- Will load collisions, tp the player, and fade screen
--- The player should be frozen when calling this function
--- @param coords table <string, number>
--- @return nil
local function collisionTpCoordTransition(coords)
    debugPrint('Starting full collision teleport')

    -- Fade screen to black
    if not IsScreenFadedOut() then DoScreenFadeOut(500) end
    while not IsScreenFadedOut() do Wait(5) end

    -- Teleport player back
    local playerPed = PlayerPedId()
    RequestCollisionAtCoord(coords.x, coords.y, coords.z)
    SetEntityCoords(playerPed, coords.x, coords.y, coords.z)
    local attempts = 0
    while not HasCollisionLoadedAroundEntity(playerPed) do
        Wait(5)
        attempts = attempts + 1
        if attempts > 1000 then
            debugPrint('Failed to load collisions')
            error()
        end
    end

    debugPrint('Collisions loaded, player teleported')
end

--- Stops spectating
local function stopSpectating()
    debugPrint('Stopping spectate process init')
    isSpectateEnabled = false
    isInTransitionState = true

    -- blackout screen
    DoScreenFadeOut(500)
    while not IsScreenFadedOut() do Wait(5) end

    -- reset spectator
    NetworkSetInSpectatorMode(false, nil)
    SetMinimapInSpectatorMode(false, nil)
    if spectatorReturnCoords then
        debugPrint('Returning spectator to original coords')
        if not pcall(collisionTpCoordTransition, spectatorReturnCoords) then
            debugPrint('collisionTpCoordTransition failed!')
        end
    else
        debugPrint('No spectator return coords saved')
    end
    prepareSpectatorPed(false)

    -- resetting cache + threads
    clearGamerTagInfo()
    storedTargetPed = nil
    storedTargetPlayerId = nil
    storedTargetServerId = nil
    spectatorReturnCoords = nil

    -- fading screen back & marking as done
    DoScreenFadeIn(500)
    while IsScreenFadingIn() do Wait(5) end
    isInTransitionState = false
end

--- Starts the thread that continuously teleport the spectator under the target
--- This is being done this way to make sure we are compatible with all VOIP resources
--- In the future check if it's possible to migrate to using `SetFocusPosAndVel` instead.
local function createSpectatorTeleportThread()
    debugPrint('Starting teleport follower thread')
    CreateThread(function()
        local initialTargetServerid = storedTargetServerId
        while isSpectateEnabled and storedTargetServerId == initialTargetServerid do
            -- If ped doesn't exist anymore try to resolve it again
            if not DoesEntityExist(storedTargetPed) then
                local newPed = GetPlayerPed(storedTargetPlayerId)
                if newPed > 0 then
                    if newPed ~= storedTargetPed then
                        debugPrint(("Spectated target ped (%s) updated to %s"):format(storedTargetPlayerId, newPed))
                    end
                    storedTargetPed = newPed
                else
                    sendSnackbarMessage('error', 'nui_menu.player_modal.actions.interaction.notifications.spectate_failed', true)
                    debugPrint(("Spectated player (%s) no longer exists, ending spectate..."):format(storedTargetPlayerId))
                    stopSpectating()
                    break
                end
            end

            -- Update Teleport
            local newSpectateCoords = calculateSpectatorCoords(GetEntityCoords(storedTargetPed))
            SetEntityCoords(PlayerPedId(), newSpectateCoords.x, newSpectateCoords.y, newSpectateCoords.z, 0, 0, 0, false)

            Wait(500)
        end
    end)
end

RegisterCommand('txAdmin:menu:endSpectate', function()
    -- We don't want this triggering when menu is open or when spectate isn't enabled
    if not isSpectateEnabled or isMenuVisible then return end
    TriggerServerEvent('txAdmin:menu:endSpectate')
    stopSpectating()
end)

--- Cycles the spectate to next or previous player
--- @param isNext boolean - If true, will spectate the next player in the list
local function handleSpecCycle(isNext)
    -- We don't want to cycle if the player is moving down the menu using arrow keys
    -- or if pause is open, or if spectate isn't enabled
    if isMenuVisible or IsPauseMenuActive() or not isSpectateEnabled then
        return
    end
    if isInTransitionState then
        return debugPrint('Currently in transition moment, cannot change target')
    end
    if storedTargetServerId == nil then
        return debugPrint('Cannot cycle prev/next player because current one is not saved')
    end
    debugPrint(('Cycling spectate from target: %s, isNext: %s'):format(
        tostring(storedTargetServerId),
        tostring(isNext)
    ))
    TriggerServerEvent('txAdmin:menu:specPlayerCycle', storedTargetServerId, isNext)
end

RegisterCommand('txAdmin:menu:specNextPlayer', function()
    handleSpecCycle(true)
end)

RegisterCommand('txAdmin:menu:specPrevPlayer', function()
    handleSpecCycle(false)
end)

RegisterNetEvent('txAdmin:menu:specPlayerCycleFail', function()
    sendSnackbarMessage('error', 'nui_menu.player_modal.actions.interaction.notifications.spectate_cycle_failed', true)
end)


-- Client-side event handler for an authorized spectate request
RegisterNetEvent('txAdmin:menu:specPlayerResp', function(targetServerId, targetCoords)
    if isInTransitionState then
        stopSpectating()
        error('Spectate request received while in transition state')
    end

    -- check if self-spectate
    if targetServerId == GetPlayerServerId(PlayerId()) then
        return sendSnackbarMessage('error', 'nui_menu.player_modal.actions.interaction.notifications.spectate_yourself', true)
    end

    -- mark transitory state - locking the init of another spectate
    isInTransitionState = true

    -- wiping any previous spectate cache
    -- maybe not needed, but just to make sure
    storedTargetPed = nil
    storedTargetPlayerId = nil
    storedTargetServerId = nil

    -- saving current player coords and preparing ped
    if spectatorReturnCoords == nil then
        local spectatorPed = PlayerPedId()
        spectatorReturnCoords = GetEntityCoords(spectatorPed)
    end
    prepareSpectatorPed(true)

    -- teleport player under target and fade to black
    debugPrint(('Targets coords = x: %f, y: %f, z: %f'):format(targetCoords.x, targetCoords.y, targetCoords.z))
    local coordsUnderTarget = calculateSpectatorCoords(targetCoords)
    if not pcall(collisionTpCoordTransition, coordsUnderTarget) then
        debugPrint('collisionTpCoordTransition failed!')
        stopSpectating()
        return
    end

    -- resolving target and saving in cache
    -- this will try for up to 5 seconds
    local targetResolveAttempts = 0
    local resolvedPlayerId = -1
    local resolvedPed = 0
    while (resolvedPlayerId <= 0 or resolvedPed <= 0) and targetResolveAttempts < 100 do
        targetResolveAttempts = targetResolveAttempts + 1
        resolvedPlayerId = GetPlayerFromServerId(targetServerId)
        resolvedPed = GetPlayerPed(resolvedPlayerId)
        Wait(50)
    end

    --If failed to resolve the targer
    if (resolvedPlayerId <= 0 or resolvedPed <= 0) then
        debugPrint('Failed to resolve target PlayerId or Ped')
        -- reset spectator
        if not pcall(collisionTpCoordTransition, spectatorReturnCoords) then
            debugPrint('collisionTpCoordTransition failed!')
        end
        prepareSpectatorPed(false)
        -- Fade screen back
        DoScreenFadeIn(500)
        while IsScreenFadedOut() do Wait(5) end
        -- mark as finished
        isInTransitionState = false
        spectatorReturnCoords = nil
        return sendSnackbarMessage('error', 'nui_menu.player_modal.actions.interaction.notifications.spectate_failed', true)
    end

    -- if player resolved
    debugPrint('Resolved target player ped: ' .. tostring(resolvedPed))
    storedTargetPed = resolvedPed
    storedTargetPlayerId = resolvedPlayerId
    storedTargetServerId = targetServerId

    -- start spectating
    NetworkSetInSpectatorMode(true, resolvedPed)
    SetMinimapInSpectatorMode(true, resolvedPed)
    debugPrint(('Set spectate to true for resolvedPed (%s)'):format(resolvedPed))

    isSpectateEnabled = true
    isInTransitionState = false
    clearGamerTagInfo()
    createGamerTagInfo()
    createSpectatorGamerTagThread() --needs to be called after ending transition state
    createSpectatorTeleportThread()
    createScaleformThread()

    -- Fade screen back
    DoScreenFadeIn(500)
    while IsScreenFadedOut() do Wait(5) end
end)
