if GetConvar('txAdmin-serverMode', 'false') ~= 'true' then
  return
end

local ServerCtxObj = {
  oneSync = {
    type = nil,
    status = false
  },
  projectName = nil,
  maxClients = 30,
  locale = nil
}

CreateThread(function()
  -- If we don't wait for a tick there is some race condition that
  -- sometimes prevents debugPrint lmao
  Wait(0)
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
  
  debugPrint((canAccess and "^2" or "^1") .. GetPlayerName(src) ..
               " does " .. (canAccess and "" or "NOT ") .. "have menu permission.")
  TriggerClientEvent('txAdmin:menu:setAccessible', src, canAccess)
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

RegisterServerEvent('txAdmin:menu:sendAnnouncement', function(message)
  local src = source
  
  -- TODO: Security, permission check
  if false then return end
  
  debugPrint("Player ^2" .. GetPlayerName(src) .. "^0 sent announcement: ^4" .. message)
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
    
    -- TODO: Uncomment live code
    --local players = GetPlayers()
    --for serverID in pairs(players) do
    --  local ped = GetPlayerPed(serverID)
    --  
    --  local veh = GetVehiclePedIsIn(ped, false)
    --  local vehClass = "walking"
    --  if veh and veh > 0 then 
    --    local class = GetVehicleClass(veh)
    --    if class == 8 then
    --      vehClass = "biking"
    --    elseif class == 14 then
    --      vehClass = "boating"
    --    else
    --      vehClass = "driving"
    --    end
    --  end
    --  
    --  local data = {
    --    id = serverID,
    --    health = GetEntityHealth(ped),
    --    vehicleStatus = vehClass,
    --    pos = GetEntityCoords(ped),
    --    username = GetPlayerName(serverID),
    --  }
    --  table.insert(found, data)
    --  Wait(0)
    --end
    
    -- TODO: remove test data
    for i = 1, 1000 do
      local data = {
        id = i,
        vehicleStatus = "walking",
        health = math.random(0, 200),
        distance = math.random(1, 5000),
        username = 'skeleboi' .. i,
        pos = vec3(0, 0, 0)
      }
      table.insert(found, data)
    end
    
    TriggerClientEvent('txAdmin:menu:setPlayerState', -1, found)
    Wait(1000 * 15)
  end
end)