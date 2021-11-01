--Check Environment
if GetConvar('txAdminServerMode', 'false') ~= 'true' then
  return
end

-- Holds map containing source players original routing
-- bucket so we can use it on end spectate.
local ORIGINAL_SPEC_BUCKET = {}

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
    -- If our source and target are not in the same routing bucket
    -- lets store it in our map

    -- If a player isn't stored within the map upon the spectateExit call,
    -- it can be assumed that the player had the same routing bucket as its target,
    -- and we don't need to store data in the map
    if tgtBucket ~= srcBucket then
      debugPrint(('Target and source buckets differ | src: %s, bkt: %i | tgt: %s, bkt: %i'):format(src, srcBucket, target, tgtBucket))
      ORIGINAL_SPEC_BUCKET[src] = srcBucket
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
    -- If this is nil, assume that no routing bucket change is needed,
    -- as it wasn't stored
    local prevRoutBucket = ORIGINAL_SPEC_BUCKET[src]
    -- Since lua treats 0 as truthy, actually don't need to handle
    -- explicit nil check for int 0
    if prevRoutBucket then
      SetPlayerRoutingBucket(src, prevRoutBucket)
      -- Clean up our prev bucket map
      ORIGINAL_SPEC_BUCKET[src] = nil
    end
  end
end)

AddEventHandler('playerDropped', function()
  local src = source
  if ORIGINAL_SPEC_BUCKET[src] then
    ORIGINAL_SPEC_BUCKET[src] = nil
  end
end)
