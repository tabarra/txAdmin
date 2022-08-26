--Check Environment
if GetConvar('txAdminServerMode', 'false') ~= 'true' then
  return
end

-- =============================================
--  This file is for server side handlers related to
--  actions defined on Menu's "Main Page"
-- =============================================

RegisterNetEvent('txAdmin:menu:tpToWaypoint', function()
  local src = source
  local allow = PlayerHasTxPermission(src, 'players.teleport')
  if allow then
    TriggerClientEvent('txAdmin:menu:tpToWaypoint', src)
    Wait(250)
    local coords = GetEntityCoords(GetPlayerPed(src))
    TriggerEvent("txaLogger:menuEvent", src, "teleportWaypoint", true,
        { x = coords[1], y = coords[2], z = coords[3] })
  else
    TriggerEvent("txaLogger:menuEvent", src, "teleportWaypoint", false)
  end
end)

RegisterNetEvent('txAdmin:menu:sendAnnouncement', function(message)
  local src = source
  if type(message) ~= 'string' then
    return
  end
  local allow = PlayerHasTxPermission(src, 'players.message')
  TriggerEvent("txaLogger:menuEvent", src, "announcement", allow, message)
  if allow then
    local author = TX_ADMINS[tostring(src)].tag
    TriggerClientEvent("txAdmin:receiveAnnounce", -1, message, author)
  end
end)

RegisterNetEvent('txAdmin:menu:fixVehicle', function()
  local src = source
  local allow = PlayerHasTxPermission(src, 'menu.vehicle')
  TriggerEvent("txaLogger:menuEvent", src, "vehicleRepair", allow)
  if allow then
    TriggerClientEvent('txAdmin:menu:fixVehicle', src)
  end
end)

RegisterNetEvent('txAdmin:menu:clearArea', function(radius)
  local src = source
  local allow = PlayerHasTxPermission(src, 'menu.clear_area')
  TriggerEvent("txaLogger:menuEvent", src, "clearArea", allow, radius)
  if allow then
    TriggerClientEvent('txAdmin:menu:clearArea', src, radius)
  end
end)

local CREATE_AUTOMOBILE = GetHashKey('CREATE_AUTOMOBILE')

--- Spawn a vehicle on the server at the request of a client
---@param model string
---@param isAutomobile boolean
RegisterNetEvent('txAdmin:menu:spawnVehicle', function(model, isAutomobile)
  local src = source
  if type(model) ~= 'string' then
    return
  end
  if type(isAutomobile) ~= 'boolean' then
    return
  end

  local allow = PlayerHasTxPermission(src, 'menu.vehicle')
  TriggerEvent("txaLogger:menuEvent", src, "spawnVehicle", allow, model)
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

    local veh
    if isAutomobile then
      coords = vec4(coords[1], coords[2], coords[3], heading)
      veh = Citizen.InvokeNative(CREATE_AUTOMOBILE, GetHashKey(model), coords);
    else
      veh = CreateVehicle(model, coords[1], coords[2], coords[3], heading, true, true)
    end
    local tries = 0
    while not DoesEntityExist(veh) do
      Wait(0)
      tries = tries + 1
      if tries > 250 then
        break
      end
    end
    local netID = NetworkGetNetworkIdFromEntity(veh)
    debugPrint(string.format("spawn vehicle (src=^3%d^0, model=^4%s^0, isAuto=%s^0, netID=^3%s^0)", src, model,
        (isAutomobile and '^2yes' or '^3no'), netID))

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
--- @param netId int
RegisterNetEvent("txAdmin:menu:deleteVehicle", function(netId)
  local src = source
  local allow = PlayerHasTxPermission(src, 'menu.vehicle')
  TriggerEvent("txaLogger:menuEvent", src, "deleteVehicle", allow)
  if allow then
    local vehicle = NetworkGetEntityFromNetworkId(netId)
    DeleteEntity(vehicle)
  end
end)

RegisterNetEvent('txAdmin:menu:healAllPlayers', function()
  local src = source
  local allow = PlayerHasTxPermission(src, 'players.heal')
  TriggerEvent("txaLogger:menuEvent", src, "healAll", true)
  if allow then
    -- For use with third party resources that handle players
    -- 'revive state' standalone from health (esx-ambulancejob, qb-ambulancejob, etc)
    TriggerEvent("txAdmin:events:healedPlayer", {id = -1})
    TriggerClientEvent('txAdmin:menu:healed', -1)
  end
end)

RegisterNetEvent('txAdmin:menu:healMyself', function()
  local src = source
  local allow = PlayerHasTxPermission(src, 'players.heal')
  TriggerEvent("txaLogger:menuEvent", src, "healSelf", allow)
  if allow then
    -- For use with third party resources that handle players
    -- 'revive state' standalone from health (esx-ambulancejob, qb-ambulancejob, etc)
    TriggerEvent("txAdmin:events:healedPlayer", {id = src})
    TriggerClientEvent('txAdmin:menu:healed', src)
  end
end)

RegisterNetEvent('txAdmin:menu:healPlayer', function(id)
  local src = source
  if type(id) ~= 'string' and type(id) ~= 'number' then
    return
  end
  id = tonumber(id)
  local allow = PlayerHasTxPermission(src, 'players.heal')
  if allow then
    local ped = GetPlayerPed(id)
    if ped then
      -- For use with third party resources that handle players
      -- 'revive state' standalone from health (esx-ambulancejob, qb-ambulancejob, etc)
      -- TriggerEvent('txAdmin:healedPlayer', id)
      TriggerEvent("txAdmin:events:healedPlayer", {id = id})
      TriggerClientEvent('txAdmin:menu:healed', id)
    end
  end
  TriggerEvent('txaLogger:menuEvent', src, "healPlayer", allow, id)
end)

RegisterNetEvent('txAdmin:menu:showPlayerIDs', function(enabled)
  local src = source
  local allow = PlayerHasTxPermission(src, 'menu.viewids')
  TriggerEvent("txaLogger:menuEvent", src, "showPlayerIDs", allow, enabled)
  if allow then
    TriggerClientEvent('txAdmin:menu:showPlayerIDs', src, enabled)
  end
end)

---@param x number|nil
---@param y number|nil
---@param z number|nil
RegisterNetEvent('txAdmin:menu:tpToCoords', function(x, y, z)
  local src = source
  if type(x) ~= 'number' or type(y) ~= 'number' or type(z) ~= 'number' then
    return
  end

  local allow = PlayerHasTxPermission(src, 'players.teleport')
  TriggerEvent("txaLogger:menuEvent", src, "teleportCoords", true, { x = x, y = y, z = z })
  if allow then
    TriggerClientEvent('txAdmin:menu:tpToCoords', src, x, y, z)
  end
end)
