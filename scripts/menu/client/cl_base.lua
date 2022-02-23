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
local isMenuEnabled = (GetConvar('txAdmin-menuEnabled', 'false') == 'true')


-- Check if menu is in debug mode 
CreateThread(function()
  isMenuDebug = (GetConvar('txAdmin-menuDebug', 'false') == 'true')
end)

local function checkMenuAccessible()
  if not isMenuEnabled then
    sendSnackbarMessage('error', 'nui_menu.misc.not_enabled', true)
    return false
  end
  if not menuIsAccessible then
    sendSnackbarMessage('error', 'nui_menu.misc.menu_not_allowed', true)
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
RegisterCommand('txadmin', txadmin)
RegisterCommand('tx', txadmin)

RegisterCommand('txAdmin:menu:openPlayersPage', function()
  if not checkMenuAccessible() then return end
  sendMenuMessage('setMenuPage', 1)
  toggleMenuVisibility(true)
  SetNuiFocus(true, true)
end)



-- =============================================
--  The rest of the file will only run if menu is enabled
-- =============================================
if not isMenuEnabled then
  return
end

-- Checking with server if we are an admin
TriggerServerEvent('txsv:checkAdminStatus')

-- Triggered as callback of txsv:checkAdminStatus
RegisterNetEvent('txcl:setAdmin', function(username, perms, rejectReason)
  if type(perms) == 'table' then
    print("^2[AUTH] logged in as '"..username.."' with perms: " .. json.encode(perms or "nil"))
    menuIsAccessible = true
    menuPermissions = perms
    RegisterKeyMapping('txadmin', 'Menu: Open Main Page', 'keyboard', '')
    RegisterKeyMapping('txAdmin:menu:openPlayersPage', 'Menu: Open Players page', 'KEYBOARD', '')
    RegisterKeyMapping('txAdmin:menu:noClipToggle', 'Menu: Toggle NoClip', 'keyboard', '')
    RegisterKeyMapping('txAdmin:menu:togglePlayerIDs', 'Menu: Toggle Player IDs', 'KEYBOARD', '')
    RegisterKeyMapping('txAdmin:menu:endSpectate', 'Menu: Exit spectate mode', 'keyboard', 'BACK')
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
  sendMenuMessage('resetSession')
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
  debugModeEnabled = enabled
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
  print("React loaded, sending variables.")
  sendMenuMessage('setDebugMode', isMenuDebug)
  sendMenuMessage('setPermissions', menuPermissions)
  
  CreateThread(function()
    updateServerCtx()
    while ServerCtx == false do Wait(0) end
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
