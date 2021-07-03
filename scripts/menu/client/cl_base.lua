-- =============================================
--  This file is for base menu functionality (visibility,
--  keybinds, focus callbacks's, threads, etc)
-- =============================================

-- Variable that determines whether a player can even access the menu
menuIsAccessible = false
isMenuDebug = false
isMenuVisible = false
menuPermissions = {}
lastTpCoords = false;

CreateThread(function()
  isMenuDebug = (GetConvar('txAdminMenu-debugMode', 'false') == 'true')
end)

-- Command to be used with the register key mapping
local function txadmin()
  -- Check if we have an available ref to the global function
  if not registerTxKeybinds then
    return sendSnackbarMessage('error', 'nui_menu.misc.not_enabled', true)
  end

  if menuIsAccessible then
    toggleMenuVisibility()
  else
    sendSnackbarMessage('error', 'nui_menu.misc.menu_not_allowed', true)
  end
end
RegisterCommand('txadmin', txadmin)
RegisterCommand('tx', txadmin)

-- The rest of the file will not be run if convar isn't set
if (GetConvar('txEnableMenuBeta', 'false') ~= 'true') then
  print('^3[txAdminMenu]^0 Beta Menu not enabled.')
  return
end

-- Since the menu yields/receives keyboard
-- focus we need to store that the menu is already visible
function registerTxKeybinds()
  -- Only register keybinds for authed users
  if menuIsAccessible then
    RegisterKeyMapping('txadmin', 'Open the txAdmin Menu', 'keyboard', '')
    RegisterKeyMapping('txAdmin:menu:endSpectate', 'Exit spectate mode', 'keyboard', 'BACK')
  end
end

--[[ Debug Events / Commands ]]

-- Manual reauth command
RegisterCommand('txAdmin-reauth', function()
  if debugModeEnabled then
    debugPrint("re-authing")
    TriggerEvent('txAdmin:menu:reAuth')
  end
end)

-- Triggers reauth process
RegisterNetEvent('txAdmin:menu:reAuth', function()
  menuIsAccessible = false
  sendMenuMessage('reAuth')
end)

-- Will toggle debug logging
RegisterNetEvent('txAdmin:events:enableDebug', function(enabled)
  debugModeEnabled = enabled
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

-- When the escape key is pressed in menu
RegisterNUICallback('closeMenu', function(_, cb)
  isMenuVisible = false
  debugPrint('Releasing all NUI Focus')
  SetNuiFocus(false)
  SetNuiFocusKeepInput(false)
  cb({})
end)

RegisterNUICallback('playSound', function(sound, cb)
  PlaySoundFrontend(-1, SoundEnum[sound], 'HUD_FRONTEND_DEFAULT_SOUNDSET', 1)
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

CreateThread(function()
  TriggerEvent('chat:removeSuggestion', '/txadmin')
  TriggerEvent('chat:removeSuggestion', '/tx')
end)
