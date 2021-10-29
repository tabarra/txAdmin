--Check Environment
if GetConvar('txAdminServerMode', 'false') ~= 'true' then
  return
end

local frozenPlayers = {}

local function isPlayerFrozen(targetId)
  return frozenPlayers[targetId] or false
end

local function setPlayerFrozenInMap(targetId, status)
  frozenPlayers[targetId] = status or nil
end

RegisterNetEvent("txAdmin:menu:freezePlayer", function(targetId)
  local src = source
  local allow = PlayerHasTxPermission(src, 'players.freeze')
  TriggerEvent("txaLogger:menuEvent", src, "freezePlayer", allow, targetId)
  if allow then
    local newFrozenStatus = not isPlayerFrozen(targetId)
    setPlayerFrozenInMap(targetId, newFrozenStatus)

    TriggerClientEvent("txAdmin:menu:freezeResp", src, newFrozenStatus)
    TriggerClientEvent("txAdmin:menu:freezePlayer", targetId, newFrozenStatus)
  end
end)
