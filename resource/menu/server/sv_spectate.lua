-- Prevent running in monitor mode
if not TX_SERVER_MODE then return end
-- Prevent running if menu is disabled
if not TX_MENU_ENABLED then return end

--- Logic for starting to spectate + authorization + routing buckets
--- @param targetId number The player id to spectate.
local function handleSpectatePlayer(targetId)
  local src = source
  -- Sanity as this is still converted tonumber on client side
  if type(targetId) ~= 'string' and type(targetId) ~= 'number' then
    return
  end
  targetId = tonumber(targetId)

  local allow = PlayerHasTxPermission(src, 'players.spectate')

  if allow then
    local targetPed = GetPlayerPed(targetId)
    -- Lets exit if the target doesn't exist
    if not targetPed then
      return
    end
    -- checking if spectator and target are on the same routing bucket
    local targetBucket = GetPlayerRoutingBucket(targetId)
    local srcBucket = GetPlayerRoutingBucket(src)
    local sourcePlayerStateBag = Player(src).state
    if srcBucket ~= targetBucket then
      debugPrint(('Target and source buckets differ | src: %s, bkt: %i | tgt: %s, bkt: %i'):format(src, srcBucket, targetId, targetBucket))
      -- if there was a routing bucket set, we shouldn't overwrite it due to the cycle feature
      if sourcePlayerStateBag.__spectateReturnBucket == nil then
        sourcePlayerStateBag.__spectateReturnBucket = srcBucket
      end
      SetPlayerRoutingBucket(src, targetBucket)
    end

    TriggerClientEvent('txcl:spectate:start', src, targetId, GetEntityCoords(targetPed))
  end
  TriggerEvent('txsv:logger:menuEvent', src, 'spectatePlayer', allow, targetId)
end

RegisterNetEvent('txsv:req:spectate:start', handleSpectatePlayer)


--- Called to get the previous/next player to cycle to
--- @param currentTargetId number The current target id.
--- @param isNextPlayer boolean If we should cycle to the next player or not.
RegisterNetEvent('txsv:req:spectate:cycle', function(currentTargetId, isNextPlayer)
  local src = source

  local onlinePlayers = GetPlayers()
  -- We don't allow cycling if there are less than two players online.
  if #onlinePlayers <= 2 then
    return TriggerClientEvent('txcl:spectate:cycleFailed', src)
  end

  -- Filter out the current src from the online players list
  local sourceIndex = tableIndexOf(onlinePlayers, tostring(src))
  table.remove(onlinePlayers, sourceIndex)

  -- Find next target
  local nextTargetId
  local currentTargetServerIndex = tableIndexOf(onlinePlayers, tostring(currentTargetId))
  if currentTargetServerIndex < 0 then
    debugPrint('Current spectate target id not found for online players, resetting to onlinePlayers[1]')
    nextTargetId = onlinePlayers[1]
    --TODO: the correct thing would be to do a while to find the corect next/rev, based on value and not index
  else
    if isNextPlayer then
      nextTargetId = onlinePlayers[currentTargetServerIndex + 1] or onlinePlayers[1]
    else
      nextTargetId = onlinePlayers[currentTargetServerIndex - 1] or onlinePlayers[#onlinePlayers]
    end
  end

  -- Replying to client
  debugPrint(('Cycling to %s player | src: %s, curTgtId: %s, nextTgtId: %s'):format(
    isNextPlayer and 'next' or 'prev',
    src,
    currentTargetId,
    nextTargetId
  ))
  handleSpectatePlayer(nextTargetId)
end)

RegisterNetEvent('txsv:req:spectate:end', function()
  local src = source
  local allow = PlayerHasTxPermission(src, 'players.spectate')
  if allow then
    local sourcePlayerStateBag = Player(src).state
    -- If this is nil, assume that no routing bucket change is needed,
    -- as it wasn't stored
    local prevRoutBucket = sourcePlayerStateBag.__spectateReturnBucket
    -- Since lua treats 0 as truthy, actually don't need to handle
    -- explicit nil check for int 0
    if prevRoutBucket then
      SetPlayerRoutingBucket(src, prevRoutBucket)
      sourcePlayerStateBag.__spectateReturnBucket = nil
    end
  end
end)
