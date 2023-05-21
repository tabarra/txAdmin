-- =============================================
--  This file contains any strictly *pure* functions
--  that are utilized by the rest of the menu.
--  Many of them need to be available with menu disabled
-- =============================================

--- Send a persistent alert to NUI
---@param key string An unique ID for this alert
---@param level string The level for the alert
---@param message string The message for this alert
---@param isTranslationKey boolean Whether the message is a translation key
function sendPersistentAlert(key, level, message, isTranslationKey)
    debugPrint(('Sending persistent alert, key: %s, level: %s, message: %s'):format(key, level, message))
    sendMenuMessage('setPersistentAlert', { key = key, level = level, message = message, isTranslationKey = isTranslationKey })
end

--- Clear a persistent alert on screen
---@param key string The unique ID passed in sendPersistentAlert for the notification
function clearPersistentAlert(key)
    debugPrint(('Clearing persistent alert, key: %s'):format(key))
    sendMenuMessage('clearPersistentAlert', { key = key })
end

--- Snackbar message
---@param level string The severity of the message can be 'info', 'error', or 'warning'
---@param message string Message to display with snackbar
---@param isTranslationKey boolean
---@param tOptions table | nil
function sendSnackbarMessage(level, message, isTranslationKey, tOptions)
    debugPrint(('Sending snackbar message, level: %s, message: %s, isTranslationKey: %s'):format(level, message, isTranslationKey))
    sendMenuMessage(
        'setSnackbarAlert',
        {
            level = level,
            message = message,
            isTranslationKey = isTranslationKey,
            tOptions = tOptions
        }
    )
end

--- Send data to the NUI frame
---@param action string Action
---@param data any Data corresponding to action
function sendMenuMessage(action, data)
    SendNUIMessage({
        action = action,
        data = data
    })
end

--- Close the menu if pause menu is opened using the default P key
local function createPauseMenuCheckerThread()
    debugPrint('Starting pause menu checker thread')
    CreateThread(function()
        while isMenuVisible do
            if IsPauseMenuActive() then
                toggleMenuVisibility(false)
            end
            Wait(250)
        end
    end)
end

--- Toggle visibility of the txAdmin NUI menu
function toggleMenuVisibility(visible)
    if (visible == true and isMenuVisible) or (visible == false and not isMenuVisible) then
        return
    end
    if visible == nil then
        if not isMenuVisible and IsPauseMenuActive() then
            return
        end
    end

    sendReactPlayerlist()
    if visible ~= nil then
        isMenuVisible = visible
        sendMenuMessage('setVisible', visible)
    else
        isMenuVisible = not isMenuVisible
        sendMenuMessage('setVisible', isMenuVisible)
    end
    createPauseMenuCheckerThread()

    -- check if noclip and spectate still works with menu closed
    if not isMenuVisible then
        SetNuiFocus(false)
        SetNuiFocusKeepInput(false)
    end
    playLibrarySound('enter')
end

--- Calculate a safe Z coordinate based off the (X, Y)
---@param x number
---@param y number
---@return number|nil
function FindZForCoords(x, y)
    local found = true
    local START_Z = 1500
    local z = START_Z
    while found and z > 0 do
        local _found, _z = GetGroundZAndNormalFor_3dCoord(x + 0.0, y + 0.0, z - 1.0)
        if _found then
            z = _z + 0.0
        end
        found = _found
        Wait(0)
    end
    if z == START_Z then return nil end
    return z + 0.0
end

--- Display simple help scaleform
---@param msg string - The message to display
function DisplayHelpTxtThisFrame(msg)
    BeginTextCommandDisplayHelp('STRING')
    AddTextComponentString(msg)
    AddTextComponentSubstringTextLabel(msg)
    EndTextCommandDisplayHelp(0, 1, 0, -1);
end

--- Used for local feedback and permission checks. Checks are still
--- performed on the server.
---@param perms table Array of all player permissions
---@param perm string The specific permission
---@return boolean
function DoesPlayerHavePerm(perms, perm)
    if type(perms) ~= 'table' then
        return false
    end

    for _, v in pairs(perms) do
        if v == perm or v == 'all_permissions' then
            return true
        end
    end

    return false
end

-- Sound libraries
local fivemSoundLibrary = {
    move = {'NAV_UP_DOWN', 'HUD_FRONTEND_DEFAULT_SOUNDSET'},
    enter = {'SELECT', 'HUD_FRONTEND_DEFAULT_SOUNDSET'},
    confirm = {'CONFIRM_BEEP', 'HUD_MINI_GAME_SOUNDSET'},
}
local redmSoundLibrary = {
    move = {'round_start_countdown_tick', 'RDRO_Poker_Sounds'},
    enter = {'BET_PROMPT', 'HUD_POKER'},
    confirm = {'BULLSEYE', 'FMA_ARCHERY_Sounds'},
}

--- Used to play UI sounds
---@param sound string
function playLibrarySound(sound)
    if IS_FIVEM then
        PlaySoundFrontend(-1, fivemSoundLibrary[sound][1], fivemSoundLibrary[sound][2], 1)
    else
        Citizen.InvokeNative(0x9D746964E0CF2C5F, redmSoundLibrary[sound][1], redmSoundLibrary[sound][2])  -- ReleaseShardSounds
        Wait(0)
        PlaySoundFrontend(redmSoundLibrary[sound][1], redmSoundLibrary[sound][2], true, 1);
    end
end
