--Check Environment
if GetConvar('txAdminServerMode', 'false') ~= 'true' then
  return
end

-- =============================================
--  This file is for general server side handlers
--  related to actions defined within Menu's
--  "Player Modal"
-- =============================================

RegisterNetEvent('txAdmin:menu:tpToPlayer', function(id)
  local src = source
  if type(id) ~= 'number' then
    return
  end

  local allow = PlayerHasTxPermission(src, 'players.teleport')
  local data = { x = nil, y = nil, z = nil, playerName = nil }

  data.playerName = "unknown"
  if allow then
    -- ensure the player ped exists
    local ped = GetPlayerPed(id)
    if ped then
      data.playerName = GetPlayerName(id)
      local coords = GetEntityCoords(ped)
      data.x = coords[1]
      data.y = coords[2]
      data.z = coords[3]
      TriggerClientEvent('txAdmin:menu:tpToCoords', src, data.x, data.y, data.z)
    end
  end

  TriggerEvent('txaLogger:menuEvent', src, 'teleportPlayer', allow, data)
end)

RegisterNetEvent('txAdmin:menu:summonPlayer', function(id)
  local src = source
  if type(id) ~= 'number' then
    return
  end
  local allow = PlayerHasTxPermission(src, 'players.teleport')
  local playerName = "unknown"
  if allow then
    -- ensure the target player ped exists
    local ped = GetPlayerPed(id)
    if ped then
      local coords = GetEntityCoords(GetPlayerPed(src))
      TriggerClientEvent('txAdmin:menu:tpToCoords', id, coords[1], coords[2], coords[3])
      playerName = GetPlayerName(id)
    end
  end
  TriggerEvent('txaLogger:menuEvent', src, 'summonPlayer', allow, playerName)
end)

RegisterNetEvent('txAdmin:menu:spectatePlayer', function(id)
  local src = source
  -- Sanity as this is still converted tonumber on client side
  if type(id) ~= 'string' and type(id) ~= 'number' then
    return
  end
  id = tonumber(id)
  local allow = PlayerHasTxPermission(src, 'players.spectate')
  if allow then
    local target = GetPlayerPed(id)
    -- Lets exit if the target doesn't exist
    if not target then
      return
    end
    local tgtBucket = GetPlayerRoutingBucket(id)
    local srcBucket = GetPlayerRoutingBucket(src)
    if tgtBucket ~= srcBucket then 
      ADMIN_DATA[tostring(src)].bucket = srcBucket
      SetPlayerRoutingBucket(src, tgtBucket)
    end

    local tgtCoords = GetEntityCoords(target)
    TriggerClientEvent('txAdmin:menu:specPlayerResp', src, id, tgtCoords)
  end
  TriggerEvent('txaLogger:menuEvent', src, 'spectatePlayer', allow, id)
end)



RegisterNetEvent('txAdmin:menu:endSpectate', function()
  local src = source 
  local allow = PlayerHasTxPermission(src, 'players.spectate')
  if allow then 
    if ADMIN_DATA[tostring(src)].bucket then 
      SetPlayerRoutingBucket(src, ADMIN_DATA[tostring(src)].bucket)
      ADMIN_DATA[tostring(src)].bucket = 0 
    end
  end
end)