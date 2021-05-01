-- Variable that determines whether a player can even access the menu
local menuIsAccessible

RegisterKeyMapping('txAdmin:openMenu', 'Open the txAdmin Menu', 'keyboard', 'f1')

--- Authentication logic
RegisterNetEvent('txAdmin:menu:setAccessible', function(canAccess)
  if type(canAccess) ~= 'boolean' then error() end
  debugPrint('Menu Accessible: ' .. tostring(canAccess))
  menuIsAccessible = canAccess
end)

CreateThread(function()
  local ServerCtx = GlobalState.txAdminServerCtx
  debugPrint('Checking for ServerCtx')
  debugPrint(json.encode(ServerCtx))

  -- Dispatch ctx to React state
  SendNUIMessage({
    action = 'setServerCtx',
    data = GlobalState.txAdminServerCtx
  })
  
  TriggerServerEvent("txAdmin:menu:checkAccess")
end)
--- End auth


--- Snackbar message
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
RegisterCommand('txAdmin:openMenu', function()
  if menuIsAccessible then
    -- TODO: Temporary until keyboard handlers for main page are all done
    SetNuiFocus(true, true)
    SendNUIMessage({
      action = 'setVisible',
      data = true
    })
  end
end)


--[[ 
  NUI Callbacks from the menu
 ]]

-- Triggered whenever we require full focus, cursor and keyboard
RegisterNUICallback('focusInput', function(data, cb)
  -- Temporary until keyboard handlers for main page are all done
  SetNuiFocus(true, true)
  SetNuiFocusKeepInput()
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
  debugPrint(json.encode(data))
  TriggerServerEvent('txAdmin:menu:tpToCoords', data.x + 0.0, data.y + 0.0, data.z + 0.0)
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
  debugPrint(data)
  TriggerServerEvent('txAdmin:menu:sendAnnouncement', data.message)
  cb({})
end)

RegisterNUICallback('fixVehicle', function(data, cb)
  local ped = PlayerPedId()
  local veh = GetVehiclePedIsIn(ped, false)
  if (veh == 0) then
    sendSnackbarMessage('error', 'You are currently not in a vehicle')
  end
  
  TriggerServerEvent('txAdmin:menu:fixVehicle')
  cb({})
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
  if oldVel > 0.0 then
    SetVehicleEngineOn(veh, true, true, false)
    SetVehicleForwardSpeed(veh, oldVel)
  end
end)