-- Prevent running in monitor mode
if not TX_SERVER_MODE then return end
-- Prevent running if menu is disabled
if not TX_MENU_ENABLED then return end

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
    PrintStructuredTrace(json.encode({
      type = 'txAdminCommandBridge',
      command = 'announcement',
      author = TX_ADMINS[tostring(src)].username,
      message = message,
    }))
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
