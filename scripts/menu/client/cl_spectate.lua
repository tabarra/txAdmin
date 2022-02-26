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
-- Spectated players associated server id
local currentSpectateServerId

-- Whether should we lock the camera to the target ped
local isInTransitionState = false

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
        -- Jooat hash of txAdmin:menu:specNextPlayer
        InstructionalButton('~INPUT_698AE6AF~', "Next Player")
        PopScaleformMovieFunctionVoid()

        PushScaleformMovieFunction(scaleform, "SET_DATA_SLOT")
        PushScaleformMovieFunctionParameterInt(0)
        -- Jooat hash of txAdmin:menu:specPrevPlayer
        InstructionalButton('~INPUT_5E76B036~', "Previous Player")
        PopScaleformMovieFunctionVoid()

        -- Exit spectate button
        PushScaleformMovieFunction(scaleform, "SET_DATA_SLOT")
        PushScaleformMovieFunctionParameterInt(2)
        -- Joat Hash for 'txAdmin:menu:endSpectate' command
        InstructionalButton('~INPUT_417C207D~', "Exit Spectate Mode")
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
    SetMpGamerTagHealthBarColor(storedGameTag, 129)
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

--- Will freeze the player and set the entity to invisible
--- @param bool boolean - Whether we should prepare or cleanup
local function preparePlayerForSpec(bool)
    local playerPed = PlayerPedId()
    FreezeEntityPosition(playerPed, bool)
    SetEntityVisible(playerPed, not bool, 0)
end

--- Will load collisions, tp the player, and invoke transition scaleforms
--- @param coords table <string, number>
--- @return void
local function collisionTpCoordTransition(coords)
    debugPrint('Collision TP init')
    local playerPed = PlayerPedId()

    -- Scaleform Transition
    if not IsScreenFadedOut() then DoScreenFadeOut(500) end

    while not IsScreenFadedOut() do Wait(0) end

    RequestCollisionAtCoord(coords.x, coords.y, coords.z)
    SetEntityCoords(playerPed, coords.x, coords.y, coords.z)
    -- The player is still frozen while we wait for collisions to load
    while not HasCollisionLoadedAroundEntity(playerPed) do
        Wait(5)
    end

    debugPrint('Collisions loaded around player')
end

--- @param tgtPed number - The stored targeted ped for spectate
local function disableSpectate(tgtPed)
    preparePlayerForSpec(false)
    isSpectateEnabled = false

    storedSpectateTarget = nil
    debugPrint('Disabling spectate process init')

    DoScreenFadeOut(500)
    while not IsScreenFadedOut() do Wait(0) end

    if not lastSpectateLocation then
        error('Last location previous to spectate was not stored properly')
    end

    if not storedTargetPed then
        error('Target ped was not stored to unspectate')
    end


    NetworkSetInSpectatorMode(false, tgtPed)

    preparePlayerForSpec(false)

    debugPrint('Last Spectate Location')
    debugPrint(lastSpectateLocation)
    SetEntityCoords(PlayerPedId(), lastSpectateLocation.x, lastSpectateLocation.y, lastSpectateLocation.z)



    DoScreenFadeIn(500)
    while IsScreenFadingIn() do Wait(0) end

    clearGamerTagInfo()
    storedTargetPed = nil
    isInTransitionState = false
    currentSpectateServerId = nil
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
                    disableSpectate(storedTargetPed)
                    break
                end
            end

            -- Update Teleport
            local newSpectateCoords = calculateSpectatorCoords(GetEntityCoords(storedTargetPed))
            SetEntityCoords(PlayerPedId(), newSpectateCoords.x, newSpectateCoords.y, newSpectateCoords.z, 0, 0, 0, false)
        end
    end)
end



--- @param tgtPed number - The ped to spectate
--- @param tgtPlayerId number - The player id to spectate
--- @param tgtTpCoords table<string, number> - The coords to teleport to
local function spectateTgtAtCoords(tgtPed, tgtTpCoords)
    local targetCoords = calculateSpectatorCoords(tgtTpCoords)
    debugPrint(('Targets coords = x: %f, y: %f, z: %f'):format(targetCoords.x, targetCoords.y, targetCoords.z))

    collisionTpCoordTransition(targetCoords)
    NetworkSetInSpectatorMode(true, tgtPed)
    debugPrint(('Set spectate to true for targetPed (%s)'):format(tgtPed))

    if IsScreenFadedOut then
        DoScreenFadeIn(500)
    end

    createGamerTagInfo()
    createSpectatorTeleportThread()
    createScaleformThread()
    isSpectateEnabled = true
    isInTransitionState = false
end

RegisterCommand('txAdmin:menu:endSpectate', function()
    -- We don't want this triggering when menu is open or when spectate isn't enabled
    if not isSpectateEnabled or isMenuVisible then return end

    disableSpectate(storedTargetPed)
    TriggerServerEvent('txAdmin:menu:endSpectate')
end)

--- @param isNext boolean - If true, will spectate the next player in the list
local function handleSpecCycle(isNext)
    -- We don't want to cycle if the player is moving down the menu using arrow keys
    -- or if pause is open, or if spectate isn't enabled
    if isMenuVisible or IsPauseMenuActive() or not isSpectateEnabled then
        return
    end

    if isInTransitionState then
        return debugPrint('Currently in transition moment, cannot spectate next player')
    end

    debugPrint(('Spectate enabled: %s | Spectating: %s'):format(tostring(isSpectateEnabled), tostring(currentSpectateServerId)))
    if not isSpectateEnabled or currentSpectateServerId == nil then return end
    TriggerServerEvent('txAdmin:menu:specPlayerCycle', currentSpectateServerId, isNext)
end

RegisterCommand('txAdmin:menu:specNextPlayer', function()
    handleSpecCycle(true)
end)

RegisterCommand('txAdmin:menu:specPrevPlayer', function()
    handleSpecCycle(false)
end)

--- Ran if we failed to resolve a target player to spectate
--- @return void
local function cleanupFailedResolve()
    local playerPed = PlayerPedId()

    RequestCollisionAtCoord(lastSpectateLocation.x, lastSpectateLocation.y, lastSpectateLocation.z)
    SetEntityCoords(playerPed, lastSpectateLocation.x, lastSpectateLocation.y, lastSpectateLocation.z)
    -- The player is still frozen while we wait for collisions to load

    preparePlayerForSpec(false)

    DoScreenFadeIn(500)
    -- At this point, we can remove the lock for transition state
    isInTransitionState = false
    sendSnackbarMessage('error', 'nui_menu.player_modal.actions.interaction.notifications.spectate_failed', true)
    clearGamerTagInfo()
    storedTargetPlayerId = nil
    storedTargetPed = nil
end

--- We need to wait to make sure that the player is actually available once we teleport
--- this can take some time so we do this. Automatically breaks if a player isn't resolved
--- within 5 seconds.
--- @param tgtServerId number - The server id of the player to target spectating for
--- @return number - The resolved target ped
local function tryToResolvePlayerPed(tgtServerId)
    local tgtPlayerId = GetPlayerFromServerId(tgtServerId)
    local resolvePlayerAttempts = 0
    local resolvePlayerFailed

    repeat
        if resolvePlayerAttempts > 100 then
            resolvePlayerFailed = true
            break;
        end
        Wait(50)
        debugPrint('Waiting for player to resolve')
        tgtPlayerId = GetPlayerFromServerId(tgtServerId)
        resolvePlayerAttempts = resolvePlayerAttempts + 1
    until (GetPlayerPed(tgtPlayerId) > 0) and tgtPlayerId ~= -1

    if resolvePlayerFailed then
        cleanupFailedResolve()
        error('Failed to resolve player to spectate')
    end

    debugPrint('Target Ped successfully found!')

    return GetPlayerPed(tgtPlayerId)
end

-- Client-side event handler for an authorized spectate request
RegisterNetEvent('txAdmin:menu:specPlayerResp', function(targetServerId, coords)
    if isInTransitionState then
        error('Spectate request received while in transition state')
        disableSpectate(storedTargetPed)
    end

    clearGamerTagInfo()

    local curPed = PlayerPedId()
    lastSpectateLocation = GetEntityCoords(curPed)
    currentSpectateServerId = targetServerId

    local targetPlayerId = GetPlayerFromServerId(targetServerId)
    if targetPlayerId == PlayerId() then
        return sendSnackbarMessage('error', 'nui_menu.player_modal.actions.interaction.notifications.spectate_yourself', true)
    end

    isInTransitionState = true

    local gameTime = GetGameTimer()

    DoScreenFadeOut(500)
    while not IsScreenFadedOut() do
        if gameTime + 15000 < GetGameTimer() then
            cleanupFailedResolve()
            error('Failed to resolve player to spectate')
        end
        Wait(0)
    end

    local tpCoords = calculateSpectatorCoords(coords)
    SetEntityCoords(curPed, tpCoords.x, tpCoords.y, tpCoords.z, 0, 0, 0, false)
    preparePlayerForSpec(true)

    targetPlayerId = GetPlayerFromServerId(targetServerId)

    debugPrint('Resolve target player id')

    local resolvedPed = tryToResolvePlayerPed(targetServerId)
    debugPrint('Resolved target player ped: ' .. tostring(resolvedPed))
    storedTargetPed = resolvedPed

    storedTargetPlayerId = GetPlayerFromServerId(targetServerId)

    spectateTgtAtCoords(resolvedPed, tpCoords)
end)

RegisterNetEvent('txAdmin:menu:specPlayerCycleFail', function()
    sendSnackbarMessage('error', 'nui_menu.player_modal.actions.interaction.notifications.spectate_cycle_failed', true)
end)

CreateThread(function()
    while true do
        if isSpectateEnabled and not isInTransitionState then
            createGamerTagInfo()
        else
            clearGamerTagInfo()
        end
        Wait(50)
    end
end)
