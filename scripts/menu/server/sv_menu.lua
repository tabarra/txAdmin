--Check Environment
if GetConvar('txAdminServerMode', 'false') ~= 'true' then
  return
end
local apiHost = GetConvar("txAdmin-apiHost", "invalid")
local pipeToken = GetConvar("txAdmin-pipeToken", "invalid")
if apiHost == "invalid" or pipeToken == "invalid" then
  logError('API Host or Pipe Token ConVars not found. Do not start this resource if not using txAdmin.')
  return
end

--Erasing the token convar for security reasons
if (GetConvar('TXADMIN_MENU_DEBUG', 'false') ~= 'true') then
  SetConvar("txAdmin-pipeToken", "removed")
end


-- Vars
local adminPermissions = {}


--- Determine if a source has a given permission
---@param source number
---@param permission string
---@return boolean
local function PlayerHasTxPermission(source, permission)
  local allow = false
  local perms = adminPermissions[source]
  if perms then
    for _, perm in pairs(perms) do
      if perm == 'all_permissions' or permission == perm then
        allow = true
        break
      end
    end
  end
  debugPrint(string.format("permission check (src=^3%d^0, perm=^4%s^0, result=%s^0)",
    source, permission, (allow and '^2true' or '^1false')))
  return allow
end

AddEventHandler('txAdmin:events:adminsUpdated', function(onlineAdminIDs)
  debugPrint('^3Admins changed. Online admins: ' .. json.encode(onlineAdminIDs) .. "^0")
  
  -- Collect old and new admin IDs
  local refreshAdminIds = {}
  for id, _ in pairs(adminPermissions) do
    refreshAdminIds[id] = id
  end
  for _, newId in pairs(onlineAdminIDs) do
    refreshAdminIds[newId] = newId
  end
  debugPrint('^3Forcing ' .. #refreshAdminIds .. ' clients to re-auth')
  
  -- Resetting all admin permissions
  adminPermissions = {}
  
  -- Informing clients that they need to reauth
  for id, _ in pairs(refreshAdminIds) do
    TriggerClientEvent('txAdmin:menu:reAuth', id)
  end
end)

-- 
-- [[ WebPipe Proxy ]]
--
local _pipeLastReject
RegisterNetEvent('txAdmin:WebPipe')
AddEventHandler('txAdmin:WebPipe', function(callbackId, method, path, headers, body)
  local s = source
  if type(callbackId) ~= 'number' or type(headers) ~= 'table' then return end
  if type(method) ~= 'string' or type(path) ~= 'string' or type(body) ~= 'string' then return end
  
  -- Reject requests from un-authed players
  if path ~= '/auth/nui' and not adminPermissions[s] then
    if _pipeLastReject ~= nil then
      if (GetGameTimer() - _pipeLastReject) < 250 then
        _pipeLastReject = GetGameTimer()
        return
      end
    end
    debugPrint(string.format(
      "^3WebPipe[^5%d^0:^1%d^3]^0 ^1rejected request from ^3%s^1 for ^5%s^0", s, callbackId, s, path))
    TriggerClientEvent('txAdmin:WebPipe', s, callbackId, 403, "{}", {})
    return
  end
  
  -- Adding auth information
  if path == '/auth/nui' then
    headers['X-TxAdmin-Token'] = pipeToken
    headers['X-TxAdmin-Identifiers'] = table.concat(GetPlayerIdentifiers(s), ', ')
  else
    headers['X-TxAdmin-Token'] = 'not_required' -- so it's easy to detect webpipes
  end
  
  local url = "http://" .. apiHost .. path:gsub("//", "/")
  debugPrint(string.format("^3WebPipe[^5%d^0:^1%d^3]^0 ^4>>^0 ^6%s^0", s, callbackId, url))
  debugPrint(string.format("^3WebPipe[^5%d^0:^1%d^3]^0 ^4>>^0 ^6Headers: %s^0", s, callbackId, json.encode(headers)))

  PerformHttpRequest(url, function(httpCode, data, resultHeaders)
    -- fixing body for error pages (eg 404)
    -- this is likely because of how json.encode() interprets null and an empty table
    data = data or ''
    resultHeaders['x-badcast-fix'] = 'https://youtu.be/LDU_Txk06tM' -- fixed in artifact v3996

    -- fixing redirects
    if resultHeaders.Location then
      if resultHeaders.Location:sub(1, 1) == '/' then
        resultHeaders.Location = '/WebPipe' .. resultHeaders.Location
      end
    end

    -- fixing cookies
    if resultHeaders['Set-Cookie'] then
      local cookieHeader = resultHeaders['Set-Cookie']
      local cookies = type(cookieHeader) == 'table' and cookieHeader or { cookieHeader }
      
      for k in pairs(cookies) do
        cookies[k] = cookies[k] .. '; SameSite=None; Secure'
      end
      
      resultHeaders['Set-Cookie'] = cookies
    end

    -- Sniff permissions out of the auth request
    if path == '/auth/nui' and httpCode == 200 then
      local resp = json.decode(data)
      if resp and resp.isAdmin then
        debugPrint("Caching admin " .. s .. " permissions: " .. json.encode(resp.permissions))
        adminPermissions[s] = resp.permissions
      else
        adminPermissions[s] = nil
      end
    end
  
    local errorCode = tonumber(httpCode) >= 400
    local resultColor = errorCode and '^1' or '^2'
    debugPrint(string.format(
      "^3WebPipe[^5%d^0:^1%d^3]^0 %s<< %s ^4%s^0", s, callbackId, resultColor, httpCode, path))
    if errorCode then
      debugPrint(string.format(
        "^3WebPipe[^5%d^0:^1%d^3]^0 %s<< Headers: %s^0", s, callbackId, resultColor, json.encode(resultHeaders)))
    end
    
    TriggerClientEvent('txAdmin:WebPipe', s, callbackId, httpCode, data, resultHeaders)
  end, method, body, headers, {
    followLocation = false
  })
end)
--
-- [[ End WebPipe ]]
--

--
-- [[ ServerCtxObj ]]
--
local ServerCtxObj = {
  oneSync = {
    type = nil,
    status = false
  },
  projectName = nil,
  maxClients = 30,
  locale = nil
}

local function syncServerCtx()
  local oneSyncConvar = GetConvar('onesync', 'off')
  if oneSyncConvar == ('on' or 'legacy') then
    ServerCtxObj.oneSync.type = oneSyncConvar
    ServerCtxObj.status = true
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

  local txAdminLocale = GetConvar('txAdmin-locale', 'en')
  ServerCtxObj.locale = txAdminLocale

  debugPrint('Server CTX assigned to GlobalState, CTX:')
  debugPrint(json.encode(ServerCtxObj))
  GlobalState.txAdminServerCtx = ServerCtxObj
end

-- Everytime the txAdmin convars are changed this event will fire
-- Therefore, lets update global state with that.
AddEventHandler('txAdmin:events:configChanged', function()
  debugPrint('configChanged event triggered, syncing GlobalState')
  syncServerCtx()
end)

CreateThread(function()
  -- If we don't wait for a tick there is some race condition that
  -- sometimes prevents debugPrint lmao
  Wait(0)
  syncServerCtx()
end)
--
-- [[ End ServerCtxObj ]]
--


RegisterServerEvent('txAdmin:menu:checkAccess', function()
  local src = source
  local canAccess = not (adminPermissions[src] == nil)
  debugPrint((canAccess and "^2" or "^1") .. GetPlayerName(src) ..
               " does " .. (canAccess and "" or "NOT ") .. "have menu permission.")
  TriggerClientEvent('txAdmin:menu:setAccessible', src, canAccess)
end)

RegisterServerEvent('txAdmin:menu:playerModeChanged', function(mode)
  local src = source
  if mode ~= 'godmode' and mode ~= 'noclip' and mode ~= 'none' then
    debugPrint("Invalid player mode requested by " .. GetPlayerName(src) .. " (mode: " .. (mode or 'nil'))
    return
  end
  
  local allow = PlayerHasTxPermission(src, 'players.playermode')
  TriggerEvent("txaLogger:menuEvent", src, "playerModeChanged", allow, mode)
  if allow then
    TriggerClientEvent('txAdmin:menu:playerModeChanged', src, mode)
  end
end)

RegisterServerEvent('txAdmin:menu:healMyself', function()
  local src = source
  local allow = PlayerHasTxPermission(src, 'players.heal')
  TriggerEvent("txaLogger:menuEvent", src, "healSelf", allow)
  if allow then
    TriggerClientEvent('txAdmin:menu:healed', src)
  end
end)

RegisterServerEvent('txAdmin:menu:healPlayer', function(id)
  local src = source
  if type(id) ~= 'string' and type(id) ~= 'number' then return end
  id = tonumber(id)
  local allow = PlayerHasTxPermission(src, 'players.heal')
  local playerName = "unknown"
  if allow then
    local ped = GetPlayerPed(id)
    if ped then TriggerClientEvent('txAdmin:menu:healed', id) end
    playerName = GetPlayerName(id)
  end
  TriggerEvent('txaLogger:menuEvent', src, "healPlayer", allow, playerName)
end)

RegisterServerEvent('txAdmin:menu:healAllPlayers', function()
  local src = source
  local allow = PlayerHasTxPermission(src, 'players.heal')
  TriggerEvent("txaLogger:menuEvent", src, "healAll", true)
  if allow then
    TriggerClientEvent('txAdmin:menu:healed', -1)
  end
end)

---@param x number|nil
---@param y number|nil
---@param z number|nil
RegisterServerEvent('txAdmin:menu:tpToCoords', function(x, y, z)
  local src = source
  if type(x) ~= 'number' or type(y) ~= 'number' or type(z) ~= 'number' then return end
    
  local allow = PlayerHasTxPermission(src, 'players.teleport')
  TriggerEvent("txaLogger:menuEvent", src, "teleportCoords", true, { x = x, y = y, z = z })
  if allow then
    TriggerClientEvent('txAdmin:menu:tpToCoords', src, x, y, z)
  end
end)

RegisterServerEvent('txAdmin:menu:tpToPlayer', function(id)
  local src = source
  if type(id) ~= 'number' then return end
    
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

RegisterServerEvent('txAdmin:menu:summonPlayer', function(id)
  local src = source
  if type(id) ~= 'number' then return end
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

RegisterServerEvent('txAdmin:menu:tpToWaypoint', function()
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

RegisterServerEvent('txAdmin:menu:sendAnnouncement', function(message)
  local src = source
  if type(message) ~= 'string' then return end
  local allow = PlayerHasTxPermission(src, 'players.message')
  TriggerEvent("txaLogger:menuEvent", src, "announcement", allow, message)
  if allow then
    TriggerClientEvent('txAdmin:receiveAnnounce', -1, message)
  end
end)

RegisterServerEvent('txAdmin:menu:fixVehicle', function()
  local src = source
  local allow = PlayerHasTxPermission(src, 'menu.vehicle')
  TriggerEvent("txaLogger:menuEvent", src, "vehicleRepair", allow)
  if allow then
    TriggerClientEvent('txAdmin:menu:fixVehicle', src)
  end
end)

local CREATE_AUTOMOBILE = GetHashKey('CREATE_AUTOMOBILE')

--- Spawn a vehicle on the server at the request of a client
---@param model string
---@param isAutomobile boolean
RegisterServerEvent('txAdmin:menu:spawnVehicle', function(model, isAutomobile)
  local src = source
  if type(model) ~= 'string' then return end
  if type(isAutomobile) ~= 'boolean' then return end
  
  local allow = PlayerHasTxPermission(src, 'menu.vehicle')
  TriggerEvent("txaLogger:menuEvent", src, "spawnVehicle", allow, model)
  if allow then
    local ped = GetPlayerPed(src)
    local coords = GetEntityCoords(ped)
    local heading = GetEntityHeading(ped)
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
      
    TriggerClientEvent('txAdmin:menu:spawnVehicle', src, netID)
  end
end)

local function getPlayersLicense(src)
  for _, v in ipairs(GetPlayerIdentifiers(src)) do
    if string.sub(v, 1, string.len("license:")) == "license:" then
      return v:sub(string.len("license:") + 1)
    end
  end
end

--[[ Emit player list to clients ]]
CreateThread(function()
  while true do
    local found = {}
    
    local players = GetPlayers()
    for _, serverID in ipairs(players) do
      local ped = GetPlayerPed(serverID)
      local veh = GetVehiclePedIsIn(ped)
      if veh and veh > 0 then
        veh = NetworkGetNetworkIdFromEntity(veh)
      else
        veh = nil
      end
  
      local health = math.ceil(((GetEntityHealth(ped) - 100) / 100) * 100)
      found[#found + 1] = {
        id = serverID,
        health = health,
        veh = veh,
        pos = GetEntityCoords(ped),
        username = GetPlayerName(serverID),
        license = getPlayersLicense(serverID)
      }
      
      -- Lets wait a tick so we don't have hitch issues
      Wait(0)
    end
  
    -- get the list of all players to send to
    debugPrint("^4Sending ^3" .. #found .. "^4 users details to ^3" .. #adminPermissions .. "^4 admins^0")
    for id, _ in pairs(adminPermissions) do
      TriggerClientEvent('txAdmin:menu:setPlayerState', id, found)
    end
    Wait(1000 * 5)
  end
end)
