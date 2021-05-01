-- Variable that determines whether a player can even access the menu
local menuIsAccessible
local debugModeEnabled

RegisterKeyMapping('txadmin:openMenu', 'Open the txAdmin Menu', 'keyboard', 'f1')

CreateThread(function()
  local convar = GetConvar('TXADMIN_MENU_DEBUG', 'false')
  if convar == 'true' then
    debugModeEnabled = true
  end
end)

local function debugPrint(message)
  if (debugModeEnabled) then
    local msgTemplate = '^3[txAdminMenu]^0 %s'
    local msg = msgTemplate:format(message)
    print(msg)
  end
end

--- Snack
---@param level string - The severity of the message can be 'info', 'error', or 'warning' 
---@param message string - Message to display with snackbar
local function sendSnackbarMessage(level, message)
  debugPrint(('Sending snackbar message, level: %s, message: %s'):format(level, message))

  SendNUIMessage({
    method = 'setSnackbarAlert',
    data = {
      level = level,
      message = message
    }
  })
end


-- Command to be used with the register key mapping
RegisterCommand('txadmin:openMenu', function()
  -- Commented out for dev, needs to actually be set at some point
  --if (menuIsAccessible) then
    SetNuiFocusKeepInput(true)
    SendNUIMessage({
      action = 'setVisible',
      data = true
    })
  --end
end)


--[[ 
  NUI Callbacks from the menu
 ]]

-- Triggered whenever we require full focus, cursor and keyboard
RegisterNUICallback('focusInput', function(data, cb)
  SetNuiFocus(true, true)
  cb({})
end)

-- When the escape key is pressed in menu
RegisterNUICallback('closeMenu', function(data, cb)
  SetNuiFocus(false)
  cb({})
end)

-- CB From Menu
-- Data is a object with x, y, z
RegisterNUICallback('tpToCoords', function(data, cb)
  TriggerServerEvent('txAdmin:menu:tpToCoords', data)
  cb({})
end)

-- CB From Menu
RegisterNUICallback('spawnVehicle', function(data, cb)
  
  cb({})
end)

-- CB From Menu
RegisterNUICallback('healAllPlayers', function(data, cb)
  TriggerServerEvent('txAdmin:menu:healAllPlayers')
  cb({})
end)


-- CB From Menu
-- Data will be an object with a message attribute
RegisterNUICallback('sendAnnouncement', function(data, cb)
  TriggerServerEvent('txAdmin:menu:sendAnnouncement', data.message)
  cb({})
end)

RegisterNUICallback('fixVehicle', function(data, cb)
  local ped = PlayerPedId()
  local veh = GetVehiclePedIsIn(ped, false)
  if (veh == 0) then
    sendSnackbarMessage('error', 'You are currently not in a vehicle')
  end

  TriggerServerEvent('txadmin:menu:fixVehicle')
end)

--[[ 
  Sensitive Events that are triggered 
  by the server after verification
 ]]

RegisterNetEvent('txAdmin:menu:setMenuAccessible', function(canAccess)
  debugPrint('Menu Accessible: ' ..  tostring(canAccess))
  menuIsAccessible = canAccess
end)


RegisterNetEvent('txAdmin:menu:tpToCoords', function(coords)
  local ped = PlayerPedId()
  debugPrint('Teleporting to coords')
  debugPrint(json.encode(coords))

  SetEntityCoords(ped, coords.x, coords.y, coords.z , 0, 0, 0, false)
end)


--[[
  Registered and used on all clients for global events (heal all)
 ]]

RegisterNetEvent('txAdmin:menu:healed', function()
  debugPrint('Received heal event, healing to full')
  local ped = PlayerPedId()
  local maxHealth = GetEntityMaxHealth(ped)
  SetEntityHealth(ped, maxHealth)
end)