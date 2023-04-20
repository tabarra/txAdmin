-- Prevent running in monitor mode
if not TX_SERVER_MODE then return end
-- Prevent running if menu is disabled
if not TX_MENU_ENABLED then return end

-- =============================================
--  This file is for server side handlers related to
--  actions defined on Menu's "Main Page"
-- =============================================

RegisterNetEvent('txsv:req:vehicle:fix', function()
  local src = source
  local allow = PlayerHasTxPermission(src, 'menu.vehicle')
  TriggerEvent('txsv:logger:menuEvent', src, 'vehicleRepair', allow)
  if allow then
    TriggerClientEvent('txcl:vehicle:fix', src)
  end
end)

RegisterNetEvent('txsv:req:vehicle:boost', function()
  local src = source
  local allow = PlayerHasTxPermission(src, 'menu.vehicle')
  TriggerEvent('txsv:logger:menuEvent', src, 'vehicleBoost', allow)
  if allow then
    TriggerClientEvent('txcl:vehicle:boost', src)
  end
end)

---Since we can't spawn it on the server, we just respond to the client and let it handle the spawn
---@param model string
RegisterNetEvent('txsv:req:vehicle:spawn:redm', function(model)
  if not IS_REDM then return end
  local src = source
  if type(model) ~= 'string' then return end
  local allow = PlayerHasTxPermission(src, 'menu.vehicle')
  TriggerEvent('txsv:logger:menuEvent', src, 'spawnVehicle', allow, model)
  if allow then
    TriggerClientEvent('txcl:vehicle:spawn:redm', src, model)
  end
end)

--- Spawn a vehicle on the server at the request of a client (fivem)
---@param model string
---@param modelType string
RegisterNetEvent('txsv:req:vehicle:spawn:fivem', function(model, modelType)
  if not IS_FIVEM then return end
  local src = source
  if type(model) ~= 'string' then return end
  if type(modelType) ~= 'string' then return end

  --check permission
  local allow = PlayerHasTxPermission(src, 'menu.vehicle')
  TriggerEvent('txsv:logger:menuEvent', src, 'spawnVehicle', allow, model)
  if not allow then return end

  --resolve source ped
  local ped = GetPlayerPed(src)
  local coords = GetEntityCoords(ped)
  local heading = GetEntityHeading(ped)
  local sourceBucket = GetPlayerRoutingBucket(src)

  --collect data from old current vehicle (if any)
  local seatsToPlace = {}
  local oldVeh = GetVehiclePedIsIn(ped, false)
  local oldVehVelocity
  if oldVeh and oldVeh > 0 then
    oldVehVelocity = GetEntityVelocity(oldVeh)

    --for each seat
    for i = 6, -1, -1 do
      local pedInSeat = GetPedInVehicleSeat(oldVeh, i)
      if pedInSeat > 0 then
        seatsToPlace[i] = pedInSeat
      end
    end
    DeleteEntity(oldVeh)
  else
    seatsToPlace[-1] = ped
  end

  --spawn new vehicle
  local newVeh = CreateVehicleServerSetter(model, modelType, coords.x, coords.y, coords.z, heading)
  local attemptsCounter = 0
  local attemptsLimit = 400 -- 400*5 = 2s
  while not DoesEntityExist(newVeh) do
    Wait(5)
    attemptsCounter = attemptsCounter + 1
    if attemptsCounter > attemptsLimit then
      return debugPrint('Failed to spawn vehicle entity')
    end
  end
  SetEntityRoutingBucket(newVeh, sourceBucket)
  SetEntityVelocity(newVeh, oldVehVelocity)

  local vehNetId = NetworkGetNetworkIdFromEntity(newVeh)
  debugPrint(string.format(
    "spawn vehicle (src=^3%d^0, model=^4%s^0, modelType=^4%s^0, vehNetId=^3%s^0)",
    src, model, modelType, vehNetId
  ))

  --Moving peds to new vehicle and deleting old one
  --creating a ped/netid map
  local players = GetPlayers()
  local pedNetIdMap = {}
  for _, id in pairs(players) do
    local pedId = GetPlayerPed(id)
    pedNetIdMap[pedId] = id
  end
  --sending seatInVehicle event to each client
  for seatIndex, seatPed in pairs(seatsToPlace) do
    local targetSrc = pedNetIdMap[seatPed]
    if type(targetSrc) == 'string' then
      debugPrint(("setting netid %d (ped %d) into seat index %d"):format(targetSrc, seatPed, seatIndex))
      TriggerClientEvent('txcl:seatInVehicle', targetSrc, vehNetId, seatIndex, oldVehVelocity)
    end
  end
end)

--- Deletes the vehicle the player is currently in
--- @param vehNetId number
RegisterNetEvent('txsv:req:vehicle:delete', function(vehNetId)
  local src = source
  local allow = PlayerHasTxPermission(src, 'menu.vehicle')
  TriggerEvent('txsv:logger:menuEvent', src, 'deleteVehicle', allow)
  if allow then
    local vehicle = NetworkGetEntityFromNetworkId(vehNetId)
    DeleteEntity(vehicle)
  end
end)
