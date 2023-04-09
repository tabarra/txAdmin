-- =============================================
--  This file is for base menu functionality (admin status,
--  visibility, keybinds, focus callbacks's, threads, etc)
-- =============================================

-- Global Variables
-- TODO: they should be upper case
menuIsAccessible = false
isMenuVisible = false
menuPermissions = {}
lastTpCoords = false;

-- Locals
local noMenuReason = 'unknown reason'
local awaitingReauth = false

--- Logic to displaying the menu auth rejected snackbar
local function displayAuthRejectedError()
  if noMenuReason == 'admin_not_found' then
    sendSnackbarMessage('error', 'nui_menu.misc.menu_not_admin', true)
  else
    sendSnackbarMessage('error', 'nui_menu.misc.menu_auth_failed', true, { reason = noMenuReason })
  end
end

--- Tests for menu accessibility and displays error snackbar if needed
local function checkMenuAccessible()
  if not TX_MENU_ENABLED then
    sendSnackbarMessage('error', 'nui_menu.misc.not_enabled', true)
    return false
  end
  if not menuIsAccessible then
    displayAuthRejectedError()
    return false
  end

  return true
end


-- Register txAdmin command
local function txadmin(_, args)
  if not checkMenuAccessible() then return end

  -- Make visible
  toggleMenuVisibility()

  -- Shortcut to open a specific players profile
  if isMenuVisible and #args >= 1 then
    local targetPlayer = table.concat(args, ' ')
    sendMenuMessage('openPlayerModal', targetPlayer)
  end
end
RegisterCommand('txadmin', txadmin, false)
RegisterCommand('tx', txadmin, false)

RegisterCommand('txAdmin:menu:openPlayersPage', function()
  if not checkMenuAccessible() then return end
  sendMenuMessage('setMenuPage', 1)
  toggleMenuVisibility(true)
  SetNuiFocus(true, true)
end, false)



-- =============================================
--  The rest of the file will only run if menu is enabled
-- =============================================

-- Prevent running if menu is disabled
if not TX_MENU_ENABLED then return end

-- Checking with server if we are an admin
TriggerServerEvent('txsv:checkAdminStatus')

-- Triggered as callback of txsv:checkAdminStatus
RegisterNetEvent('txcl:setAdmin', function(username, perms, rejectReason)
  if type(perms) == 'table' then
    debugPrint("^2[AUTH] logged in as '" .. username .. "' with perms: " .. json.encode(perms or "nil"))
    menuIsAccessible = true
    menuPermissions = perms
    RegisterKeyMapping('txadmin', 'Menu: Open Main Page', 'keyboard', '')
    RegisterKeyMapping('txAdmin:menu:openPlayersPage', 'Menu: Open Players page', 'KEYBOARD', '')
    RegisterKeyMapping('txAdmin:menu:noClipToggle', 'Menu: Toggle NoClip', 'keyboard', '')
    RegisterKeyMapping('txAdmin:menu:togglePlayerIDs', 'Menu: Toggle Player IDs', 'KEYBOARD', '')
    RegisterKeyMapping('txAdmin:menu:endSpectate', 'Menu: Exit spectate mode', 'keyboard', 'BACK')
    RegisterKeyMapping('txAdmin:menu:specNextPlayer', 'Menu: Spectate next player', 'KEYBOARD', 'DOWN')
    RegisterKeyMapping('txAdmin:menu:specPrevPlayer', 'Menu: Spectate previous player', 'KEYBOARD', 'UP')
  else
    noMenuReason = tostring(rejectReason)
    debugPrint("^3[AUTH] rejected (" .. noMenuReason .. ")")
    if awaitingReauth then
      displayAuthRejectedError()
      awaitingReauth = false
    end
    menuIsAccessible = false
    menuPermissions = {}
  end
  sendMenuMessage('setPermissions', menuPermissions)
end)


--[[ Debug Events / Commands ]]
-- Command/event to trigger a authentication attempt
local function retryAuthentication()
  debugPrint("^5[AUTH] Retrying menu authentication.")
  menuIsAccessible = false
  menuPermissions = {}
  sendMenuMessage('resetSession')
  sendMenuMessage('setPermissions', menuPermissions)
  TriggerServerEvent('txsv:checkAdminStatus')
end
RegisterNetEvent('txAdmin:menu:reAuth', retryAuthentication)
RegisterCommand('txAdmin-reauth', function ()
  sendSnackbarMessage('info', 'Retrying menu authentication.', false)
  awaitingReauth = true
  retryAuthentication()
end, false)


-- Register chat suggestions
-- txAdmin starts before the chat resource, so we need to wait a bit
CreateThread(function()
  Wait(1000)
  TriggerEvent(
    'chat:addSuggestion',
    '/tx',
    'Opens the main txAdmin Menu or specific for a player.',
    { { name = "player ID/name", help = "(Optional) Open player modal for specific ID or name." } }
  )
  TriggerEvent(
    'chat:addSuggestion',
    '/txAdmin-reauth',
    'Retries to authenticate the menu NUI.'
  )
end)


-- Will toggle debug logging
RegisterNetEvent('txAdmin:events:setDebugMode', function(enabled)
  TX_DEBUG_MODE = enabled
  sendMenuMessage('setDebugMode', TX_DEBUG_MODE)
end)


--[[ NUI Callbacks ]]
-- Triggered whenever we require full focus, cursor and keyboard
RegisterNUICallback('focusInputs', function(shouldFocus, cb)
  debugPrint('NUI Focus + Keep Input ' .. tostring(shouldFocus))
  -- Will prevent mouse focus on initial menu mount as the useEffect emits there
  if not isMenuVisible then
    return
  end
  SetNuiFocus(true, shouldFocus)
  SetNuiFocusKeepInput(not shouldFocus)
  cb({})
end)


RegisterNUICallback('reactLoaded', function(_, cb)
  debugPrint("React loaded, requesting ServerCtx.")

  CreateThread(function()
    updateServerCtx()
    while ServerCtx == false do Wait(0) end
    debugPrint("ServerCtx loaded, sending variables.")
    sendMenuMessage('setDebugMode', TX_DEBUG_MODE)
    sendMenuMessage('setServerCtx', ServerCtx)
    sendMenuMessage('setPermissions', menuPermissions)
  end)

  cb({})
end)

-- When the escape key is pressed in menu
RegisterNUICallback('closeMenu', function(_, cb)
  isMenuVisible = false
  debugPrint('Releasing all NUI Focus')
  SetNuiFocus(false)
  SetNuiFocusKeepInput(false)
  cb({})
end)
