--Check Environment
if GetConvar('txAdminServerMode', 'false') ~= 'true' then
  return
end

-- =============================================
--  This file is for general server side handlers
--  related to actions defined within Menu's
--  "Player Modal"
-- =============================================

RegisterNetEvent('txAdmin:menu:tpToPlayer', function(tgtId)
  local src = source

  if type(tgtId) ~= 'number' then
    return
  end

  local allow = PlayerHasTxPermission(src, 'players.teleport')
  local data = { x = nil, y = nil, z = nil, target = id }

  data.playerName = "unknown"
    -- More OneSync dependent code
  if allow then
    -- Check for routing bucket diff

    local tgtBucket = GetPlayerRoutingBucket(tgtId)
    local srcBucket = GetPlayerRoutingBucket(src)

    -- This isn't stored anywhere for reversion,
    -- as TP to player is typically a one sided operation
    if tgtBucket ~= srcBucket then
      SetPlayerRoutingBucket(src, tgtBucket)
    end

    -- ensure the player ped exists
    local ped = GetPlayerPed(tgtId)
    if ped then
      data.playerName = GetPlayerName(tgtId)
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
  if allow then
    -- ensure the target player ped exists
    local ped = GetPlayerPed(id)
    if ped then
      local coords = GetEntityCoords(GetPlayerPed(src))
      TriggerClientEvent('txAdmin:menu:tpToCoords', id, coords[1], coords[2], coords[3])
    end
  end
  TriggerEvent('txaLogger:menuEvent', src, 'summonPlayer', allow, id)
end)
