-- Prevent running if menu is disabled
if not TX_MENU_ENABLED then return end

-- =============================================
--  Contains all spectate related logic
-- =============================================

-- Control keys config
local CONTROLS
if IS_FIVEM then
    CONTROLS = {
        next = 187, --INPUT_FRONTEND_DOWN
        prev = 188, --INPUT_FRONTEND_UP
        exit = 194, --INPUT_FRONTEND_RRIGHT
    }
else
    CONTROLS = {
        next = 0x05CA7C52, --INPUT_FRONTEND_DOWN
        prev = 0x6319DB71, --INPUT_FRONTEND_UP
        exit = 0x156F7119, --INPUT_FRONTEND_CANCEL
    }
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


--- Helper function to get coords under target
local function calculateSpectatorCoords(coords)
    return vec3(coords.x, coords.y, coords.z - 15.0)
end

--- Will freeze the player and set the entity to invisible
--- @param enabled boolean - Whether we should prepare or cleanup
local function prepareSpectatorPed(enabled)
    local playerPed = PlayerPedId()
    FreezeEntityPosition(playerPed, enabled)
    SetEntityVisible(playerPed, not enabled, 0)

    if enabled then
        TaskLeaveAnyVehicle(playerPed, 0, 16)
    end
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
    if IS_FIVEM then
        SetMinimapInSpectatorMode(false, nil)
    end
    if spectatorReturnCoords then
        debugPrint('Returning spectator to original coords')
        if not pcall(collisionTpCoordTransition, spectatorReturnCoords) then
            debugPrint('collisionTpCoordTransition failed!')
        end
    else
        debugPrint('No spectator return coords saved')
    end
    prepareSpectatorPed(false)
    toggleShowPlayerIDs(false, false)

    -- resetting cache + threads
    storedTargetPed = nil
    storedTargetPlayerId = nil
    storedTargetServerId = nil
    spectatorReturnCoords = nil

    -- fading screen back & marking as done
    DoScreenFadeIn(500)
    while IsScreenFadingIn() do Wait(5) end
    isInTransitionState = false

    --logging that we stopped
    TriggerServerEvent('txsv:req:spectate:end')
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
    TriggerServerEvent('txsv:req:spectate:cycle', storedTargetServerId, isNext)
end

-- Instructional stuff
local keysTable = {
    {'Exit Spectate', CONTROLS.exit},
    {'Previous Player', CONTROLS.prev},
    {'Next Player', CONTROLS.next},
}
local redmInstructionGroup, redmPromptTitle

--- Key press checking (fivem)
local function fivemCheckControls()
    if IsControlJustPressed(0, CONTROLS.next) then
        handleSpecCycle(true)
    end
    if IsControlJustPressed(0, CONTROLS.prev) then
        handleSpecCycle(false)
    end
    if IsControlJustPressed(0, CONTROLS.exit) then
        stopSpectating()
    end
end

--- Key press checking (redm)
local function redmCheckControls()
    if PromptIsJustPressed(redmInstructionGroup.prompts['Next Player']) then
        handleSpecCycle(true)
    end
    if PromptIsJustPressed(redmInstructionGroup.prompts['Previous Player']) then
        handleSpecCycle(false)
    end
    if PromptIsJustPressed(redmInstructionGroup.prompts['Exit Spectate']) then
        debugPrint('exit spectate button pressed')
        stopSpectating()
    end
end
local checkControlsFunc = IS_FIVEM and fivemCheckControls or redmCheckControls


--- Creates and draws the instructional scaleform
local function createInstructionalThreads()
    debugPrint('Starting instructional buttons thread')
    --drawing thread
    CreateThread(function()
        local fivemScaleform = IS_FIVEM and makeFivemInstructionalScaleform(keysTable)
        while isSpectateEnabled do
            if IS_FIVEM then
                DrawScaleformMovieFullscreen(fivemScaleform, 255, 255, 255, 255, 0)
            else
                PromptSetActiveGroupThisFrame(redmInstructionGroup.groupId, redmPromptTitle, 1, 0, 0, 0)
            end
            Wait(0)
        end

        --cleanup of the scaleform movie
        if IS_FIVEM then
            SetScaleformMovieAsNoLongerNeeded()
        end
        debugPrint('Finished drawer thread')
    end)

    --controls thread for redm - disabled when menu is visible
    CreateThread(function()
        while isSpectateEnabled do
            if not isMenuVisible then
                checkControlsFunc()
            end
            Wait(5)
        end

        debugPrint('Finished buttons checker thread')
    end)
end


-- Register NUI callback
RegisterSecureNuiCallback('spectatePlayer', function(data, cb)
    TriggerServerEvent('txsv:req:spectate:start', tonumber(data.id))
    cb({})
end)


-- Client-side event handler for failed cype (no next player or whatever)
RegisterNetEvent('txcl:spectate:cycleFailed', function()
    sendSnackbarMessage('error', 'nui_menu.player_modal.actions.interaction.notifications.spectate_cycle_failed', true)
end)

-- Client-side event handler for an authorized spectate request
RegisterNetEvent('txcl:spectate:start', function(targetServerId, targetCoords)
    if IS_REDM then
        redmPromptTitle = CreateVarString(10, 'LITERAL_STRING', 'Spectate')
        redmInstructionGroup = makeRedmInstructionalGroup(keysTable)
    end

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
    -- this will try for up to 15 seconds (redm is slow af)
    local targetResolveAttempts = 0
    local resolvedPlayerId = -1
    local resolvedPed = 0
    while (resolvedPlayerId <= 0 or resolvedPed <= 0) and targetResolveAttempts < 300 do
        targetResolveAttempts = targetResolveAttempts + 1
        resolvedPlayerId = GetPlayerFromServerId(targetServerId)
        resolvedPed = GetPlayerPed(resolvedPlayerId)
        Wait(50)
    end

    --If failed to resolve the target
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
    if IS_FIVEM then
        SetMinimapInSpectatorMode(true, resolvedPed)
    end
    debugPrint(('Set spectate to true for resolvedPed (%s)'):format(resolvedPed))

    isSpectateEnabled = true
    isInTransitionState = false
    toggleShowPlayerIDs(true, false)
    createSpectatorTeleportThread()
    createInstructionalThreads()

    -- Fade screen back
    DoScreenFadeIn(500)
    while IsScreenFadedOut() do Wait(5) end
end)
