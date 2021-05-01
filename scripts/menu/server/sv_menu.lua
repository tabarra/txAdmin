if GetConvar('txAdminServerMode', 'false') ~= 'true' then
  return
end

local ServerCtxObj = {
  oneSync = {
    type = nil,
    status = false
  },
  projectName = nil,
  maxClients = 30
}

-- OneSync check
-- In case of hot reloads attach this event handler at start of
-- script init, Client Event that queries GlobalState are queued
-- at the **end** of resource init.
AddEventHandler('onResourceStart', function(resourceName)
  if resourceName ~= GetCurrentResourceName() then
    return
  end

  local oneSyncConvar = GetConvar('onesync', 'off')
  if oneSyncConvar == ('on' or 'legacy') then
    ServerCtxObj.oneSync.type = oneSyncConvar
    ServerCtxObj.oneSyncEnabled = true
  elseif oneSyncConvar == 'off' then
    ServerCtxObj.oneSyncStatus = false
  end

  -- Default '' in fxServer
  local svProjectName = GetConvar('sv_projectname', '')
  if svProjectName ~= '' then
    ServerCtxObj.projectName = svProjectName
  end

  -- Default 30 in fxServer
  local svMaxClients = GetConvarInt('sv_maxclients', 30)
  ServerCtxObj.maxClients = svMaxClients

  debugPrint('Server CTX assigned to GlobalState, CTX:')
  debugPrint(json.encode(ServerCtxObj))

  -- In case this was a hot reload of monitor, we send init event to all online clients
  GlobalState.txAdminServerCtx = ServerCtxObj
end)

RegisterServerEvent('txAdmin:menu:getServerCtx', function()
  local src = source
  TriggerClientEvent('txAdmin:menu:sendServerCtx', src, serverCtxObj)
end)

RegisterServerEvent('txAdmin:menu:checkAccess', function()
  local src = source
  
  -- TODO: Make this NOT constant
  local canAccess = true
  if false then canAccess = false end
  
  debugPrint((canAccess and "^3" or "^1") .. "Player " .. src ..
               "does " .. (canAccess and "" or "NOT") .. "have menu permission.")
  TriggerClientEvent('txAdmin:menu:setAccessible', src, canAccess)
end)

RegisterServerEvent('txAdmin:menu:healAllPlayers', function()
  local src = source
  
  -- TODO: Security, permission check
  if false then return end
  
  debugPrint("Healing all players!")
  TriggerClientEvent('txAdmin:menu:healed', -1)
end)

---@param x number|nil
---@param y number|nil
---@param z number|nil
RegisterServerEvent('txAdmin:menu:tpToCoords', function(x, y, z)
  local src = source
  
  -- sanity check
  if type(x) ~= 'number' or type(y) ~= 'number' or type(z) ~= 'number' then return end
  
  -- TODO: Security, permission check
  if false then return end
  
  debugPrint("Teleporting " .. src .. " to " .. x .. ", " .. y .. ", " .. z)
  TriggerClientEvent('txAdmin:menu:tpToCoords', src, x, y, z)
end)

RegisterServerEvent('txAdmin:menu:sendAnnouncement', function(message)
  local src = source
  
  -- TODO: Security, permission check
  if false then return end
  
  debugPrint("Player " .. src .. " sent announcement: " .. message)
  TriggerClientEvent('chat:addMessage', -1, {
    color = { 255, 0, 0 },
    multiline = true,
    args = { "Announcement", message }
  })
end)

RegisterServerEvent('txAdmin:menu:fixVehicle', function()
  local src = source
  
  -- TODO: Security, permission check
  if false then return end
  
  debugPrint("Player " .. GetPlayerName(src) .. " repaired their vehicle!")
  TriggerClientEvent('txAdmin:menu:fixVehicle', src)
end)