--Check Environment
if GetConvar('txAdminServerMode', 'false') ~= 'true' then
  return
end
local apiHost = GetConvar("txAdmin-apiHost", "invalid")
local pipeToken = GetConvar("txAdmin-pipeToken", "invalid")
if apiHost == "invalid" or pipeToken == "invalid" then
  print('^1API Host or Pipe Token ConVars not found. Do not start this resource if not using txAdmin.')
  return
end
if pipeToken == "removed" then
  print('^1Please do not restart the monitor resource.')
  return
end

-- Erasing the token convar for security reasons, and then restoring it if debug mode.
-- The convar needs to be reset on first tick to prevent other resources from reading it.
-- We actually need to wait two frames: one for convar replication, one for debugPrint.
SetConvar("txAdmin-pipeToken", "removed")
CreateThread(function()
  Wait(0)
  if debugModeEnabled then
    debugPrint("Restoring txAdmin-pipeToken for next monitor restart")
    SetConvar("txAdmin-pipeToken", pipeToken)
  end
end)



-- Vars
ADMIN_DATA = {}
local EMIT_BITRATE = 30000
local LAST_PLAYER_DATA = {}

-- How many MS is the interval for the update time
-- Up this to bump client performance at the cost of player page updates
local intervalUpdateTime = GetConvarInt('txAdminMenu-updateInterval', 5000)

--- Determine if a source has a given permission
---@param source number
---@param reqPerm string
---@return boolean
function PlayerHasTxPermission(source, reqPerm)
  local allow = false
  local admin = ADMIN_DATA[tostring(source)]
  if admin and admin.perms then
    for _, perm in pairs(admin.perms) do
      if perm == 'all_permissions' or reqPerm == perm then
        allow = true
        break
      end
    end
  end
  debugPrint(string.format("permission check (src=^3%d^0, perm=^4%s^0, result=%s^0)",
  source, reqPerm, (allow and '^2true' or '^1false')))
  return allow
end

---@param id string
---@param data table|nil
local function sendFullClientData(id, data)
  data = data or LAST_PLAYER_DATA
  -- TriggerLatentClientEvent('txAdmin:menu:setPlayerState', id, EMIT_BITRATE, data)
  TriggerClientEvent('txAdmin:menu:setPlayerState', id, data)
end

RegisterCommand('txAdmin-debug', function(src, args)
  if src > 0 then
    if not PlayerHasTxPermission(src, 'control.server') then
      return
    end
  end

  local playerName = (src > 0) and GetPlayerName(src) or 'Console'

  if not args[1] then
    return
  end

  if args[1] == '1' then
    debugModeEnabled = true
    debugPrint("^1!! Debug mode enabled by ^2" .. playerName .. "^1 !!^0")
    TriggerClientEvent('txAdmin:events:enableDebug', -1, true)
  elseif args[1] == '0' then
    debugPrint("^1!! Debug mode disabled by ^2" .. playerName .. "^1 !!^0")
    debugModeEnabled = false
    TriggerClientEvent('txAdmin:events:enableDebug', -1, false)
  end
end)

---@param onlineAdminIDs table
AddEventHandler('txAdmin:events:adminsUpdated', function(onlineAdminIDs)
  debugPrint('^3Admins changed. Online admins: ' .. json.encode(onlineAdminIDs) .. "^0")

  -- Collect old and new admin IDs
  local refreshAdminIds = {}
  for id, _ in pairs(ADMIN_DATA) do
    refreshAdminIds[#refreshAdminIds + 1] = id
  end
  for _, newId in pairs(onlineAdminIDs) do
    refreshAdminIds[#refreshAdminIds + 1] = newId
  end
  debugPrint('^3Forcing ' .. #refreshAdminIds .. ' clients to re-auth')

  -- Resetting all admin permissions
  ADMIN_DATA = {}

  -- Informing clients that they need to reauth
  for id, _ in pairs(refreshAdminIds) do
    TriggerClientEvent('txAdmin:menu:reAuth', id)
  end
end)

--
-- [[ WebPipe Proxy ]]
--
local _pipeLastReject
local _pipeFastCache = {}

---@param src string
---@param callbackId number
---@param statusCode number
---@param path string
---@param body string
---@param headers table
---@param cached boolean|nil
local function sendResponse(src, callbackId, statusCode, path, body, headers, cached)
  local errorCode = tonumber(statusCode) >= 400
  local resultColor = errorCode and '^1' or '^2'
  local cachedStr = cached and " ^1(cached)^0" or ""
  debugPrint(("^3WebPipe[^5%d^0:^1%d^3]^0 %s<< %s ^4%s%s^0"):format(
      src, callbackId, resultColor, statusCode, path, cachedStr))
  if errorCode then
    debugPrint(("^3WebPipe[^5%d^0:^1%d^3]^0 %s<< Headers: %s^0"):format(
        src, callbackId, resultColor, json.encode(headers)))
  end
  TriggerLatentClientEvent('txAdmin:WebPipe', src, 125000, callbackId, statusCode, body, headers)
end

RegisterNetEvent('txAdmin:WebPipe')
AddEventHandler('txAdmin:WebPipe', function(callbackId, method, path, headers, body)
  local s = source
  local src = tostring(s)
  if type(callbackId) ~= 'number' or type(headers) ~= 'table' then
    return
  end
  if type(method) ~= 'string' or type(path) ~= 'string' or type(body) ~= 'string' then
    return
  end

  -- Reject large paths as we use regex
  if #path > 300 then
    return sendResponse(s, callbackId, 400, (path):sub(1, 300), "{}", {})
  end

  -- Reject requests from un-authed players
  if path ~= '/auth/nui' and not ADMIN_DATA[src] then
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

  -- Return fast cache
  if _pipeFastCache[path] ~= nil then
    local cachedData = _pipeFastCache[path]
    sendResponse(s, callbackId, 200, path, cachedData.data, cachedData.headers, true)
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
  debugPrint(("^3WebPipe[^5%d^0:^1%d^3]^0 ^4>>^0 ^6%s^0"):format(s, callbackId, url))
  debugPrint(("^3WebPipe[^5%d^0:^1%d^3]^0 ^4>>^0 ^6Headers: %s^0"):format(s, callbackId, json.encode(headers)))

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
        if type(resp.permissions) == 'table' and type(resp.luaToken) == 'string' and string.len(resp.luaToken) == 20 then
          debugPrint(("Authenticated admin %s with permissions %s and token %s."):format(src, json.encode(resp.permissions), resp.luaToken))
          ADMIN_DATA[src] = {
            perms = resp.permissions,
            token = resp.luaToken
          }
          sendFullClientData(s)
        else
          debugPrint("Auth failed for admin %s due to response validation.")
          ADMIN_DATA[src] = nil
        end
      else
        ADMIN_DATA[src] = nil
      end
    end

    -- cache response if it is a static file
    local sub = string.sub
    if httpCode == 200 and (sub(path, 1, 5) == '/css/' or sub(path, 1, 4) == '/js/' or sub(path, 1, 5) == '/img/' or sub(path, 1, 7) == '/fonts/') then
      -- remove query params from path, so people can't consume memory by spamming cache-busters
      for safePath in path:gmatch("([^?]+)") do
        local slimHeaders = {}
        for k, v in pairs(resultHeaders) do
          if k ~= 'Set-Cookie' then
            slimHeaders[k] = v
          end
        end
        _pipeFastCache[safePath] = { data = data, headers = slimHeaders }
        debugPrint(("^3WebPipe[^5%d^0:^1%d^3]^0 ^5cached ^4%s^0"):format(s, callbackId, safePath))
        break
      end
    end

    sendResponse(s, callbackId, httpCode, path, data, resultHeaders)
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
  locale = nil,
  switchPageKey = '',
  txAdminVersion = ''
}

local function syncServerCtx()
  local oneSyncConvar = GetConvar('onesync', 'off')
  if oneSyncConvar == 'on' or oneSyncConvar == 'legacy' then
    ServerCtxObj.oneSync.type = oneSyncConvar
    ServerCtxObj.oneSync.status = true
  elseif oneSyncConvar == 'off' then
    ServerCtxObj.oneSync.type = nil
    ServerCtxObj.oneSync.status = false
  end
  -- Convar must match the event.code *EXACTLY* as shown on this site
  -- https://keycode.info/
  local switchPageKey = GetConvar('txAdminMenu-pageKey', 'Tab')
  ServerCtxObj.switchPageKey = switchPageKey

  local txAdminVersion = GetConvar('txAdmin-version', '0.0.0')
  ServerCtxObj.txAdminVersion = txAdminVersion
  -- Default '' in fxServer
  local svProjectName = GetConvar('sv_projectname', '')
  if svProjectName ~= '' then
    ServerCtxObj.projectName = svProjectName
  end

  -- Default 30 in fxServer
  local svMaxClients = GetConvarInt('sv_maxclients', 30)
  ServerCtxObj.maxClients = svMaxClients

  -- FIXME: temporarily disabled;
  -- FIXME: we cannot reenable while the custom locale doesn't work!
  local txAdminLocale = 'en' -- GetConvar('txAdmin-locale', 'en')
  ServerCtxObj.locale = txAdminLocale

  debugPrint('Server CTX assigned to GlobalState, CTX:')
  debugPrint(json.encode(ServerCtxObj))
  GlobalState.txAdminServerCtx = ServerCtxObj
end

RegisterNetEvent('txAdmin:events:getServerCtx', function()
  local src = source
  TriggerClientEvent('txAdmin:events:setServerCtx', src, ServerCtxObj)
end)

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


RegisterNetEvent('txAdmin:menu:checkAccess', function()
  local src = source
  local canAccess = not (ADMIN_DATA[tostring(src)] == nil)
  debugPrint((canAccess and "^2" or "^1") .. GetPlayerName(src) ..
      " does " .. (canAccess and "" or "NOT ") .. "have menu permission.")
  TriggerClientEvent('txAdmin:menu:setAccessible', src, canAccess)
end)

RegisterNetEvent('txAdmin:menu:playerModeChanged', function(mode)
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

RegisterNetEvent('txAdmin:menu:healMyself', function()
  local src = source
  local allow = PlayerHasTxPermission(src, 'players.heal')
  TriggerEvent("txaLogger:menuEvent", src, "healSelf", allow)
  if allow then
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
  local playerName = "unknown"
  if allow then
    local ped = GetPlayerPed(id)
    if ped then
      TriggerClientEvent('txAdmin:menu:healed', id)
    end
    playerName = GetPlayerName(id)
  end
  TriggerEvent('txaLogger:menuEvent', src, "healPlayer", allow, playerName)
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

    local tgtCoords = GetEntityCoords(target)
    TriggerClientEvent('txAdmin:menu:specPlayerResp', src, id, tgtCoords)
  end
  TriggerEvent('txaLogger:menuEvent', src, 'spectatePlayer', allow, id)
end)

RegisterNetEvent('txAdmin:menu:healAllPlayers', function()
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
    TriggerClientEvent('txAdmin:receiveAnnounce', -1, message)
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

local function getPlayersLicense(src)
  for _, v in ipairs(GetPlayerIdentifiers(src)) do
    if string.sub(v, 1, string.len("license:")) == "license:" then
      return v:sub(string.len("license:") + 1)
    end
  end
end

--[[ Emit player list to clients ]]
-- FIXME: old playerlist, remove
CreateThread(function()
  local ceil = math.ceil
  local sub = string.sub
  local pairs = pairs

  while true do
    Wait(intervalUpdateTime)

    local totalFound = 0
    local found = {}
    local players = GetPlayers()
    for _, serverID in pairs(players) do
      local ped = GetPlayerPed(serverID)
      local veh = GetVehiclePedIsIn(ped)
      if veh > 0 then
        veh = NetworkGetNetworkIdFromEntity(veh)
      end

      local health = ceil(((GetEntityHealth(ped) - 100) / 100) * 100)
      -- trim to prevent long usernames from impacting event deliverance
      local username = sub(GetPlayerName(serverID) or "unknown", 1, 75)
      local coords
      if ServerCtxObj.oneSync.status == true then
        coords = GetEntityCoords(ped)
      else
        coords = -1
      end

      local lastData = LAST_PLAYER_DATA[serverID] or {}
      if type(LAST_PLAYER_DATA[serverID]) ~= 'table' then
        LAST_PLAYER_DATA[serverID] = {}
      end

      local emitData = {}
      local sendAll = (lastData.i == nil)
      if sendAll or lastData.h ~= health then
        emitData.h = health
      end
      if sendAll or lastData.v ~= veh then
        emitData.v = veh
      end
      if sendAll or lastData.u ~= username then
        emitData.u = username
      end
      if sendAll or lastData.c ~= coords then
        emitData.c = coords
      end
      if sendAll then
        emitData.l = getPlayersLicense(serverID)
      end
      emitData.i = serverID
      for k, v in pairs(emitData) do
        LAST_PLAYER_DATA[serverID][k] = v
        -- debugPrint(("^1emit ^4%d :: ^2%s^1 = ^3%s^0"):format(serverID, k, v))
      end
      found[#found + 1] = emitData
      totalFound = totalFound + 1
      Wait(0)
    end

    -- calculate the number of admins
    local totalAdmins = 0
    for _ in pairs(ADMIN_DATA) do
      totalAdmins = totalAdmins + 1
    end

    if totalAdmins > 0 and totalFound > 0 then
      -- debugPrint("^4Sending ^3" .. totalFound .. "^4 users details to ^3" .. totalAdmins .. "^4 admins^0")
    end

    for id, _ in pairs(ADMIN_DATA) do
      sendFullClientData(id, found)
    end


  end --end while true
end)

--[[ Handle player disconnects ]]
AddEventHandler('playerDropped', function()
  local s = source
  ADMIN_DATA[tostring(s)] = nil
  LAST_PLAYER_DATA[tostring(s)] = nil
end)
