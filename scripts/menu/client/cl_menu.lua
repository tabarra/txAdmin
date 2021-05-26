-- Variable that determines whether a player can even access the menu
local menuIsAccessible
-- Since the menu yields/receives keyboard
-- focus we need to store that the menu is already visible
local isMenuVisible

RegisterKeyMapping('txAdmin:openMenu', 'Open the txAdmin Menu', 'keyboard', 'f1')

--- Send data to the NUI frame
---@param action string Action
---@param data any Data corresponding to action
local function sendMenuMessage(action, data)
  SendNUIMessage({
    action = action,
    data = data
  })
end

--- Will update ServerCtx based on GlobalState and will send it to NUI
local function updateServerCtx()
  local ServerCtx = GlobalState.txAdminServerCtx
  debugPrint('Checking for ServerCtx')
  debugPrint(json.encode(ServerCtx))

  -- Dispatch ctx to React state
  sendMenuMessage('setServerCtx', GlobalState.txAdminServerCtx)
end

--- Authentication logic
RegisterNetEvent('txAdmin:menu:setAccessible', function(canAccess)
  if type(canAccess) ~= 'boolean' then error() end
  debugPrint('Menu Accessible: ' .. tostring(canAccess))
  menuIsAccessible = canAccess
end)

CreateThread(function()
  Wait(0)
  updateServerCtx()
  TriggerServerEvent("txAdmin:menu:checkAccess")
end)

--- Snackbar message
---@param level string The severity of the message can be 'info', 'error', or 'warning'
---@param message string Message to display with snackbar
local function sendSnackbarMessage(level, message)
  debugPrint(('Sending snackbar message, level: %s, message: %s'):format(level, message))
  sendMenuMessage('setSnackbarAlert', { level = level, message = message })
end


--- Send a persistent alert to NUI
---@param key string An unique ID for this alert
---@param level string The level for the alert
---@param message string The message for this alert
local function sendPersistentAlert(key, level, message)
  debugPrint(('Sending persistent alert, key: %s, level: %s, message: %s'):format(key, level, message))
  sendMenuMessage('setPersistentAlert', { key = key, level = level, message = message })
end

--- Clear a persistent alert on screen
---@param key string The unique ID passed in sendPersistentAlert for the notification
local function clearPersistentAlert(key)
  debugPrint(('Clearing persistent alert, key: %s'):format(key))
  sendMenuMessage('clearPersistentAlert', { key = key })
end

-- Command to be used with the register key mapping
RegisterCommand('txAdmin:openMenu', function()
  if menuIsAccessible and not isMenuVisible then
    isMenuVisible = true
    -- Lets update before we open the menu
    updateServerCtx()
    SetNuiFocus(true, false)
    SetNuiFocusKeepInput(true)
    sendMenuMessage('setVisible', true)
  end
end)


--[[
  NUI Callbacks from the menu
 ]]

-- Triggered whenever we require full focus, cursor and keyboard
RegisterNUICallback('focusInputs', function(shouldFocus, cb)
  SetNuiFocus(true, shouldFocus)
  SetNuiFocusKeepInput(not shouldFocus)
  cb({})
end)

-- When the escape key is pressed in menu
RegisterNUICallback('closeMenu', function(_, cb)
  isMenuVisible = false
  SetNuiFocus(false)
  SetNuiFocusKeepInput(false)
  cb({})
end)

-- CB From Menu
-- Data is a object with x, y, z
RegisterNUICallback('tpToCoords', function(data, cb)
  debugPrint(json.encode(data))
  TriggerServerEvent('txAdmin:menu:tpToCoords', data.x + 0.0, data.y + 0.0, data.z + 0.0)
  cb({})
end)

-- This will trigger everytime the playerMode in the main menu is changed
-- it will send an object with label and value.
RegisterNUICallback('playerModeChanged', function(data, cb)
  debugPrint(json.encode(data))
  cb({})
end)

-- CB From Menu
RegisterNUICallback('spawnVehicle', function(data, cb)
  local model = data.model
  debugPrint("Model requested: " .. model)
  
  if not IsModelValid(model) then
    debugPrint("^1Invalid vehicle model: " .. model)
    cb({ e = true })
  else
    TriggerServerEvent('txAdmin:menu:spawnVehicle', model)
    cb({})
  end
end)

-- CB From Menu
RegisterNUICallback('healAllPlayers', function(data, cb)
  debugPrint(data)
  TriggerServerEvent('txAdmin:menu:healAllPlayers')
  cb({})
end)

-- CB From Menu
-- Data will be an object with a message attribute
RegisterNUICallback('sendAnnouncement', function(data, cb)
  debugPrint(data.message)
  TriggerServerEvent('txAdmin:menu:sendAnnouncement', data.message)
  cb({})
end)

RegisterNetEvent('txAdmin:receiveAnnounce', function(message)
  sendMenuMessage('addAnnounceMessage', { message = message })
end)

RegisterNUICallback('fixVehicle', function(_, cb)
  local ped = PlayerPedId()
  local veh = GetVehiclePedIsIn(ped, false)
  if (veh == 0) then
    return cb({ e = true })
  end

  TriggerServerEvent('txAdmin:menu:fixVehicle')
  cb({})
end)

--[[ Player list sync ]]
-- This is the easiest way to do it, it can technically be optimized
-- by only sending player state when it changes but meh
RegisterNetEvent('txAdmin:menu:setPlayerState', function(data)
  -- process data to add distance, remove pos
  for i in ipairs(data) do
    local row = data[i]
    local targetVec = vec3(row.pos.x, row.pos.y, row.pos.z)
    local dist = #(GetEntityCoords(PlayerPedId()) - targetVec)
    row.pos = nil
    row.distance = dist
  end

  debugPrint(json.encode(data))
  SendNUIMessage({
    action = 'setPlayerState',
    data = data
  })
end)

--[[ Teleport the player to the coordinates ]]
---@param x number
---@param y number
---@param z number
RegisterNetEvent('txAdmin:menu:tpToCoords', function(x, y, z)
  local ped = PlayerPedId()
  debugPrint('Teleporting to coords')
  debugPrint(json.encode({ x, y, z }))
  RequestCollisionAtCoord(x, y, z)
  SetPedCoordsKeepVehicle(ped, x, y, z)
  local veh = GetVehiclePedIsIn(ped, false)
  if veh and veh > 0 then SetVehicleOnGroundProperly(veh) end
end)

--[[ Heal all players ]]
RegisterNetEvent('txAdmin:menu:healed', function()
  debugPrint('Received heal event, healing to full')
  local ped = PlayerPedId()
  SetEntityHealth(ped, GetEntityMaxHealth(ped))
end)

--[[ Repair vehicle ]]
RegisterNetEvent('txAdmin:menu:fixVehicle', function()
  local ped = PlayerPedId()
  local veh = GetVehiclePedIsIn(ped, false)
  if veh and veh > 0 then
    SetVehicleUndriveable(veh, false)
    SetVehicleFixed(veh)
    SetVehicleEngineOn(veh, true, false)
    SetVehicleDirtLevel(veh, 0.0)
  end
end)

--[[ Spawn vehicles, with support for entity lockdown ]]
RegisterNetEvent('txAdmin:menu:spawnVehicle', function(netID)
  debugPrint(json.encode({ netID = netID }))
  SetNetworkIdExistsOnAllMachines(netID, true)
  SetNetworkIdCanMigrate(netID, true)
  
  -- get current veh and speed
  local ped = PlayerPedId()
  local oldVeh = GetVehiclePedIsIn(ped, false)
  local oldVel = DoesEntityExist(oldVeh) and GetEntitySpeed(oldVeh) or 0.0
  
  -- only delete if the new vehicle is found
  if oldVeh and IsPedInVehicle(ped, oldVeh, true) then
    debugPrint("Deleting existing vehicle (" .. oldVeh .. ")")
    DeleteVehicle(oldVeh)
    SetEntityAsMissionEntity(oldVeh, true, true)
    Citizen.InvokeNative(0xEA386986E786A54F, Citizen.PointerValueIntInitialized(oldVeh))
  end
  
  local tries = 0
  while NetworkGetEntityFromNetworkId(netID) == 0 do
    if tries > 50 then
      debugPrint("^1Vehicle (net ID " .. netID .. ") did not become networked for this client in time ("
              .. (tries * 25) .. "ms)")
      return
    end
    debugPrint("Waiting for vehicle networking...")
    tries = tries + 1
    Wait(50)
  end
  
  local veh = NetworkGetEntityFromNetworkId(netID)
  debugPrint("Found networked vehicle " .. netID .. " (entity " .. veh .. ")")
  SetVehicleHasBeenOwnedByPlayer(veh, true)
  TaskWarpPedIntoVehicle(ped, veh, -1)
  SetEntityHeading(veh, GetEntityHeading(ped))
  if oldVel > 0.0 then
    SetVehicleEngineOn(veh, true, true, false)
    SetVehicleForwardSpeed(veh, oldVel)
  end
end)