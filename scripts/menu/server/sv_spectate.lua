--Check Environment
if GetConvar('txAdminServerMode', 'false') ~= 'true' then
  return
end

--- @param id number The player id to spectate.
local function handleSpectatePlayer(id)
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
      tgtPlayerStateBag.state.__prevRoutingBucket = GetPlayerRoutingBucket(src)

      SetPlayerRoutingBucket(src, tgtBucket)
    end

    -- txAdmin statebags should probably be implemented using
    -- under score private keys, so we don't have servers randomly
    -- messingw with our state
    local tgtPlayerStateBag = Player(src).state

    tgtPlayerStateBag.__txAdminSpectating = true
    tgtPlayerStateBag.__txAdminSpectateTgt = id

    local tgtCoords = GetEntityCoords(target)
    TriggerClientEvent('txAdmin:menu:specPlayerResp', src, id, tgtCoords)
  end
  TriggerEvent('txaLogger:menuEvent', src, 'spectatePlayer', allow, id)
end

--- Operates under the assummption that GetPlayers is returning a sorted array
--- @param curTgtId number The current spectate target id.
--- @param isNext boolean Whether to target an id greater than current
--- @param players table<string> The array of players to target.
--- @param src number The current source id.
--- @return number The spectate target id to target next
local function findNextTgtId(curTgtId, players, isNext)
  -- returns -1 if the spectateTgtId is not found
  local currentTgtServerIdx = tableIndexOf(players, tostring(curTgtId))

  if currentTgtServerIdx < 0 then
    return error('Current spectate target id not found for online players')
  end

  if isNext then
    return players[currentTgtServerIdx + 1] or players[1]
  else
    return players[currentTgtServerIdx - 1] or players[#players]
  end
end

--- @param curTgtId number The current target id.
--- @param isNextPlayer boolean If we should cycle to the next player or not.
RegisterNetEvent('txAdmin:menu:specPlayerCycle', function(curTgtId, isNextPlayer)
  local src = source
  local allow = PlayerHasTxPermission(src, 'players.spectate')

  if allow then
    local onlinePlayers = GetPlayers()
    -- We don't allow cycling if there are less than two players online.
    if #onlinePlayers <= 2 then return TriggerClientEvent("txAdmin:menu:specPlayerCycleFail", src) end

    -- Find idx of current src
    local srcTgtIdx = tableIndexOf(onlinePlayers, tostring(src))

    -- Filter out the current src from the online players list
    table.remove(onlinePlayers, srcTgtIdx)

    local nextTgtId = findNextTgtId(curTgtId, onlinePlayers, isNextPlayer, src)

    local isPrevOrNext = isNextPlayer and 'next' or 'prev'

    debugPrint(('Cycling to %s player | src: %s, curTgtId: %s, nextTgtId: %s'):format(isPrevOrNext, src, curTgtId, nextTgtId))

    handleSpectatePlayer(nextTgtId)
  end
end)

RegisterNetEvent('txAdmin:menu:spectatePlayer', handleSpectatePlayer)

RegisterNetEvent('txAdmin:menu:endSpectate', function()
  local src = source
  local allow = PlayerHasTxPermission(src, 'players.spectate')
  if allow then
    local tgtPlayerStateBag = Player(src).state
    -- If this is nil, assume that no routing bucket change is needed,
    -- as it wasn't stored
    local prevRoutBucket = tgtPlayerStateBag.__prevRoutingBucket
    -- Since lua treats 0 as truthy, actually don't need to handle
    -- explicit nil check for int 0
    if prevRoutBucket then
      SetPlayerRoutingBucket(src, prevRoutBucket)
      tgtPlayerStateBag.__prevRoutingBucket = nil
    end
  end
end)

