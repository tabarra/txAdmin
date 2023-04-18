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

--- Spawn a vehicle on the server at the request of a client
---@param model string
---@param modelType string
RegisterNetEvent('txsv:req:vehicle:spawn', function(model, modelType)
  local src = source
  if type(model) ~= 'string' then
    return
  end
  if type(modelType) ~= 'string' then
    return
  end

  local allow = PlayerHasTxPermission(src, 'menu.vehicle')
  TriggerEvent('txsv:logger:menuEvent', src, 'spawnVehicle', allow, model)
  if allow then
    local ped = GetPlayerPed(src)
    local coords = GetEntityCoords(ped)
    local heading = GetEntityHeading(ped)

    local seatsToPlace = {}
    local oldVeh = GetVehiclePedIsIn(ped, false)
    if oldVeh and oldVeh > 0 then
      for i = 6, -1, -1 do
        local pedInSeat = GetPedInVehicleSeat(oldVeh, i)
        if pedInSeat > 0 then
          seatsToPlace[i] = pedInSeat
        end
      end
    else
      seatsToPlace[-1] = ped
    end

    local veh = CreateVehicleServerSetter(model, modelType, coords.x, coords.y, coords.z, heading)
    local tries = 0
    while not DoesEntityExist(veh) do
      Wait(0)
      tries = tries + 1
      if tries > 350 then
        break
      end
    end
    local netID = NetworkGetNetworkIdFromEntity(veh)
    debugPrint(string.format("spawn vehicle (src=^3%d^0, model=^4%s^0, modelType=^4%s^0, netID=^3%s^0)", src, model,
        (modelType), netID))
    local RoutingBucket = GetPlayerRoutingBucket(src)
    SetEntityRoutingBucket(veh, RoutingBucket)    
    -- map all player ids to peds
    local players = GetPlayers()
    local pedMap = {}
    for _, id in pairs(players) do
      local pedId = GetPlayerPed(id)
      pedMap[pedId] = id
    end

    for seatIndex, seatPed in pairs(seatsToPlace) do
      debugPrint(("setting %d into seat index %d"):format(seatPed, seatIndex))
      local targetSrc = pedMap[seatPed]
      if type(targetSrc) == 'string' then
        TriggerClientEvent('txAdmin:events:queueSeatInVehicle', targetSrc, netID, seatIndex)
      end
    end
  end
end)

--- Deletes the vehicle the player is currently in
--- @param netId number
RegisterNetEvent('txsv:req:vehicle:delete', function(netId)
  local src = source
  local allow = PlayerHasTxPermission(src, 'menu.vehicle')
  TriggerEvent('txsv:logger:menuEvent', src, 'deleteVehicle', allow)
  if allow then
    local vehicle = NetworkGetEntityFromNetworkId(netId)
    DeleteEntity(vehicle)
  end
end)
