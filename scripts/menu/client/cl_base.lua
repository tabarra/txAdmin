-- =============================================
--  This file is for base menu functionality (admin status,
--  visibility, keybinds, focus callbacks's, threads, etc)
-- =============================================

-- Global Variables
-- TODO: they should be upper case
menuIsAccessible = false
isMenuDebug = false
isMenuVisible = false
menuPermissions = {}
lastTpCoords = false;
local isMenuEnabled = (GetConvar('txEnableMenuBeta', 'false') == 'true')


-- Check if menu is in debug mode 
CreateThread(function()
  isMenuDebug = (GetConvar('txAdminMenu-debugMode', 'false') == 'true')
end)


-- Register txAdmin command
local function txadmin(_, args)
  if not isMenuEnabled then
    return sendSnackbarMessage('error', 'nui_menu.misc.not_enabled', true)
  end
  if not menuIsAccessible then
    return sendSnackbarMessage('error', 'nui_menu.misc.menu_not_allowed', true)
  end

  -- Make visible
  toggleMenuVisibility()

  -- Shortcut to open a specific players profile
  if isMenuVisible and #args >= 1 then
    local targetPlayer = table.concat(args, ' ')
    sendMenuMessage('openPlayerModal', targetPlayer)
  end
end
RegisterCommand('txadmin', txadmin)
RegisterCommand('tx', txadmin)



-- =============================================
--  The rest of the file will only run if menu is enabled
-- =============================================
if not isMenuEnabled then
  return
end

-- Checking with server if we are an admin
TriggerServerEvent('txsv:checkAdminStatus')

-- Triggered as callback of txsv:checkAdminStatus
RegisterNetEvent('txcl:setAdmin', function(perms, rejectReason)
  if type(perms) == 'table' then
    print("^2[AUTH] accepted with permissions: " .. json.encode(perms or "nil"))
    menuIsAccessible = true
    menuPermissions = perms
    RegisterKeyMapping('txadmin', 'Open the txAdmin Menu', 'keyboard', '')
    RegisterKeyMapping('txAdmin:menu:endSpectate', 'Exit spectate mode', 'keyboard', 'BACK')
  else
    print("^3[AUTH] rejected (" .. tostring(rejectReason) ..")")
    menuIsAccessible = false
    menuPermissions = {}
  end
  sendMenuMessage('setPermissions', menuPermissions)
end)


--[[ Debug Events / Commands ]]
-- Command/event to trigger a authentication attempt
local function retryAuthentication()
  print("^5[AUTH] Retrying menu authentication.")
  menuIsAccessible = false
  menuPermissions = {}
  sendMenuMessage('setPermissions', menuPermissions)
  TriggerServerEvent('txsv:checkAdminStatus')
end
RegisterCommand('txAdmin-reauth', retryAuthentication)
RegisterNetEvent('txAdmin:menu:reAuth', retryAuthentication)


-- Register chat suggestions
-- txAdmin starts before the chat resource, so we need to wait a bit
CreateThread(function()
  Wait(1000)
  TriggerEvent(
    'chat:addSuggestion', 
    '/tx', 
    'Opens the main txAdmin Menu or specific for a player.', 
    {{ name="player ID/name", help="(Optional) Open player modal for specific ID or name." }}
  )
  TriggerEvent(
    'chat:addSuggestion', 
    '/txAdmin-reauth', 
    'Retries to authenticate the menu NUI.'
  )
  TriggerEvent(
    'chat:addSuggestion', 
    '/txAdmin-debug',  -- on /scripts/menu/server/sv_base.lua
    'Enables or disables the debug mode. Requires \'control.server\' permission.',
    {{ name="1|0", help="1 to enable, 0 to disable" }}
  )
end)


-- Will toggle debug logging
RegisterNetEvent('txAdmin:events:setDebugMode', function(enabled)
  isMenuDebug = enabled
  sendMenuMessage('setDebugMode', isMenuDebug)
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


RegisterNUICallback('reactLoaded', function(aaa, cb)
  print("Got reactLoaded:")
  sendMenuMessage('setDebugMode', isMenuDebug)
  sendMenuMessage('setPermissions', menuPermissions)
  
  CreateThread(function()
    updateServerCtx()
    while ServerCtx == false do Wait(0) end
    debugPrint('Server CTX:')
    debugPrint(json.encode(ServerCtx))
    sendMenuMessage('setServerCtx', ServerCtx)
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


--[[ Threads ]]
CreateThread(function()
  while true do
    if isMenuVisible and IsPauseMenuActive() then
      toggleMenuVisibility()
    end
    Wait(250)
  end
end)
