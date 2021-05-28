--Check Environment
if GetConvar('txAdmin-serverMode', 'false') ~= 'true' then
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


-- Web UI proxy
RegisterNetEvent('txAdmin:WebPipe')
AddEventHandler('txAdmin:WebPipe', function(callbackId, method, path, headers, body)
  local s = source

  -- Adding auth information
  if path == '/auth/nui' then
    headers['X-TxAdmin-Token'] = pipeToken
    headers['X-TxAdmin-Identifiers'] = table.concat(GetPlayerIdentifiers(s), ', ')
  else
    headers['X-TxAdmin-Token'] = 'not_required' -- so it's easy to detect webpipes
  end
  
  local url = "http://" .. apiHost .. path:gsub("//", "/")
  debugPrint("[" .. callbackId .. "]>> " .. url)
  debugPrint("[" .. callbackId .. "] Headers: " .. json.encode(headers))
  

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
        adminPermissions[s] = resp.permissions
      else
        adminPermissions[s] = nil
      end
    end
  
    debugPrint("[" .. callbackId .. "] Perms: " .. json.encode(adminPermissions[s]))
    debugPrint("[" .. callbackId .. "]<< " .. httpCode)
    debugPrint("[" .. callbackId .. "]<< " .. httpCode .. ': ' .. json.encode(resultHeaders))
    TriggerClientEvent('txAdmin:WebPipe', s, callbackId, httpCode, data, resultHeaders)
  end, method, body, headers, {
    followLocation = false
  })
end)



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

RegisterServerEvent('txAdmin:menu:getServerCtx', function()
  local src = source
  TriggerClientEvent('txAdmin:menu:sendServerCtx', src, serverCtxObj)
end)

RegisterServerEvent('txAdmin:menu:healMyself', function()
  local src = source

  if false then return end

  debugPrint("^2" .. GetPlayerName(src) .. " healed themselves")
  TriggerClientEvent('txAdmin:menu:healed', src)
end)


RegisterServerEvent('txAdmin:menu:healAllPlayers', function()
  local src = source
  
  -- TODO: Security, permission check
  if false then return end
  
  debugPrint("^2" .. GetPlayerName(src) .. " healed all players!")
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
  
  debugPrint("Teleporting " .. GetPlayerName(src) .. " to " .. x .. ", " .. y .. ", " .. z)
  TriggerClientEvent('txAdmin:menu:tpToCoords', src, x, y, z)
end)

RegisterServerEvent('txAdmin:menu:tpToWaypoint', function()
  local src = source
  
  -- TODO: Security, permission check
  if false then return end
  
  TriggerClientEvent('txAdmin:menu:tpToWaypoint', src)
end)

RegisterServerEvent('txAdmin:menu:sendAnnouncement', function(message)
  local src = source
  
  -- TODO: Security, permission check
  if false then return end
  
  debugPrint("Player ^2" .. GetPlayerName(src) .. "^0 sent announcement: ^4" .. message)
  --TriggerClientEvent('chat:addMessage', -1, {
  --  color = { 255, 0, 0 },
  --  multiline = true,
  --  args = { "Announcement", message }
  --})
  TriggerClientEvent('txAdmin:receiveAnnounce', -1, message)
end)

RegisterServerEvent('txAdmin:menu:fixVehicle', function()
  local src = source
  
  -- TODO: Security, permission check
  if false then return end
  
  debugPrint("Player " .. GetPlayerName(src) .. " repaired their vehicle!")
  TriggerClientEvent('txAdmin:menu:fixVehicle', src)
end)

local CREATE_AUTOMOBILE = GetHashKey("CREATE_AUTOMOBILE")
RegisterServerEvent('txAdmin:menu:spawnVehicle', function(model)
  local src = source
  if type(model) ~= 'string' then error() end
  
  -- TODO: Security, permission check
  if false then return end
  
  debugPrint("Player " .. GetPlayerName(src) .. " spawned a ^2" .. model .. "^0!")
  local ped = GetPlayerPed(src)
  local veh = Citizen.InvokeNative(CREATE_AUTOMOBILE, GetHashKey(model), GetEntityCoords(ped));
  TriggerClientEvent('txAdmin:menu:spawnVehicle', src, NetworkGetNetworkIdFromEntity(veh))
end)

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

      found[#found + 1] = {
        id = serverID,
        health = GetEntityHealth(ped),
        veh = veh,
        pos = GetEntityCoords(ped),
        username = GetPlayerName(serverID),
      }
      
      -- Lets wait a tick so we don't have hitch issues
      Wait(0)
    end
    
    TriggerClientEvent('txAdmin:menu:setPlayerState', -1, found)
    Wait(1000 * 15)
  end
end)
