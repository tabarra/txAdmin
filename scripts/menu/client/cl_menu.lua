-- Variable that determines whether a player can even access the menu
menuIsAccessible = false
isMenuDebug = false

CreateThread(function()
  isMenuDebug = (GetConvar('TXADMIN_MENU_DEBUG', 'false') == 'true')
end)

-- Since the menu yields/receives keyboard
-- focus we need to store that the menu is already visible
local isMenuVisible
-- Last location stored in a vec3
local lastTp

RegisterKeyMapping('txadmin', 'Open the txAdmin Menu', 'keyboard', '')

--- Send data to the NUI frame
---@param action string Action
---@param data any Data corresponding to action
function sendMenuMessage(action, data)
  SendNUIMessage({
    action = action,
    data = data
  })
end

--- Will update ServerCtx based on GlobalState and will send it to NUI
local function updateServerCtx()
  local ServerCtx = GlobalState.txAdminServerCtx
  debugPrint('Checking for ServerCtx')
  debugPrint(json.encode(ServerCtx))

  -- Dispatch ctx to React state
  sendMenuMessage('setServerCtx', GlobalState.txAdminServerCtx)
end

CreateThread(function()
  Wait(0)
  updateServerCtx()
end)

--- Snackbar message
---@param level string The severity of the message can be 'info', 'error', or 'warning'
---@param message string Message to display with snackbar
local function sendSnackbarMessage(level, message, isTranslationKey)
  debugPrint(('Sending snackbar message, level: %s, message: %s, isTranslationKey: %s'):format(level, message, isTranslationKey))
  sendMenuMessage('setSnackbarAlert', { level = level, message = message, isTranslationKey = isTranslationKey })
end


--- Send a persistent alert to NUI
---@param key string An unique ID for this alert
---@param level string The level for the alert
---@param message string The message for this alert
---@param isTranslationKey boolean Whether the message is a translation key
local function sendPersistentAlert(key, level, message, isTranslationKey)
  debugPrint(('Sending persistent alert, key: %s, level: %s, message: %s'):format(key, level, message))
  sendMenuMessage('setPersistentAlert', { key = key, level = level, message = message, isTranslationKey = isTranslationKey })
end

--- Clear a persistent alert on screen
---@param key string The unique ID passed in sendPersistentAlert for the notification
local function clearPersistentAlert(key)
  debugPrint(('Clearing persistent alert, key: %s'):format(key))
  sendMenuMessage('clearPersistentAlert', { key = key })
end

--- Toggle visibility of the txAdmin NUI menu
local function toggleVisibility()
  if not isMenuVisible and IsPauseMenuActive() then
    return
  end
  -- Lets update before we open the menu
  updateServerCtx()
  sendMenuMessage('setDebugMode', isMenuDebug)
  isMenuVisible = not isMenuVisible
  sendMenuMessage('setVisible', isMenuVisible)
end

-- Command to be used with the register key mapping
RegisterCommand('txadmin', function()
  if menuIsAccessible then
    toggleVisibility()
  else
    sendSnackbarMessage('error', 'nui_menu.misc.menu_not_allowed', true)
  end
end)

-- alias
RegisterCommand('tx', function()
  ExecuteCommand('txadmin')
end)

CreateThread(function()
  TriggerEvent('chat:addSuggestion', '/txadmin', 'Open the txAdmin menu', {})
  TriggerEvent('chat:addSuggestion', '/tx', 'Open the txAdmin menu', {})
  SetNuiFocus(false, false)
end)

--[[
  NUI Callbacks from the menu
 ]]

-- Triggered whenever we require full focus, cursor and keyboard
RegisterNUICallback('focusInputs', function(shouldFocus, cb)
  SetNuiFocus(true, shouldFocus)
  SetNuiFocusKeepInput(not shouldFocus)
  cb({})
end)

-- When the escape key is pressed in menu
RegisterNUICallback('closeMenu', function(_, cb)
  isMenuVisible = false
  SetNuiFocus(false)
  SetNuiFocusKeepInput(false)
  cb({})
end)

local SoundEnum = {
  move = 'NAV_UP_DOWN',
  enter = 'SELECT'
}

RegisterNUICallback('playSound', function(sound, cb)
  PlaySoundFrontend(-1, SoundEnum[sound], 'HUD_FRONTEND_DEFAULT_SOUNDSET', 1)
  cb({})
end)

-- CB From Menu
-- Data is a object with x, y, z

RegisterNUICallback('tpToCoords', function(data, cb)
  debugPrint(json.encode(data))
  TriggerServerEvent('txAdmin:menu:tpToCoords', data.x + 0.0, data.y + 0.0, data.z + 0.0)
  cb({})
end)

-- Handle teleport to waypoint
RegisterNUICallback('tpToWaypoint', function(_, cb)
  TriggerServerEvent('txAdmin:menu:tpToWaypoint')
  cb({})
end)

RegisterNUICallback('tpToPlayer', function(data, cb)
  TriggerServerEvent('txAdmin:menu:tpToPlayer', data.id)
  cb({})
end)

RegisterNUICallback('tpBack', function(_, cb)
  if lastTp then
    TriggerServerEvent('txAdmin:menu:tpToCoords', lastTp.x, lastTp.y, lastTp.z)
    cb({})
  else
    cb({ e = true })
  end
end)

RegisterNUICallback('summonPlayer', function(data, cb)
  TriggerServerEvent('txAdmin:menu:summonPlayer', data.id)
  cb({})
end)

local function toggleGodMode(enabled)
  if enabled then
    sendPersistentAlert('godModeEnabled', 'info', 'nui_menu.page_main.player_mode.dialog_success_godmode', true)
  else
    clearPersistentAlert('godModeEnabled')
  end
  SetEntityInvincible(PlayerPedId(), enabled)
end

local function toggleFreecam(enabled)
  local ped = PlayerPedId()
  SetEntityVisible(ped, not enabled)
  SetPlayerInvincible(ped, enabled)
  FreezeEntityPosition(ped, enabled)
  NetworkSetEntityInvisibleToNetwork(ped, enabled)
  SetEntityCollision(ped, not enabled, not enabled)
  
  local veh = GetVehiclePedIsIn(ped, true)
  if veh == 0 then
    veh = nil
  else
    NetworkSetEntityInvisibleToNetwork(veh, enabled)
    SetEntityCollision(veh, not enabled, not enabled)
  end
  
  local function enableNoClip()
    lastTp = GetEntityCoords(ped)
    
    SetFreecamActive(true)
    StartFreecamThread()
    
    Citizen.CreateThread(function()
      while IsFreecamActive() do
        SetEntityLocallyInvisible(ped)
        if veh then SetEntityLocallyInvisible(veh) end
        Wait(1)
      end
      
      if veh and veh > 0 then
        local coords = GetEntityCoords(ped)
        SetEntityCoords(veh, coords[1], coords[2], coords[3])
        SetPedIntoVehicle(ped, veh, -1)
      end
    end)
  end
  
  local function disableNoClip()
    SetFreecamActive(false)
    SetGameplayCamRelativeHeading(0)
  end
  
  if not IsFreecamActive() and enabled then
    sendPersistentAlert('noClipEnabled', 'info', 'nui_menu.page_main.player_mode.dialog_success_noclip', true)
    enableNoClip()
  end
  
  if IsFreecamActive() and not enabled then
    clearPersistentAlert('noClipEnabled')
    disableNoClip()
  end
end

-- This will trigger everytime the playerMode in the main menu is changed
-- it will send the mode
RegisterNUICallback('playerModeChanged', function(mode, cb)
  debugPrint("player mode requested: " .. (mode or 'nil'))
  TriggerServerEvent('txAdmin:menu:playerModeChanged', mode)
  cb({})
end)

-- [[ Player mode changed cb event ]]
RegisterNetEvent('txAdmin:menu:playerModeChanged', function(mode)
  if mode == 'godmode' then
    toggleGodMode(true)
    toggleFreecam(false)
  elseif mode == 'noclip' then
    toggleGodMode(false)
    toggleFreecam(true)
  elseif mode == 'none' then
    toggleGodMode(false)
    toggleFreecam(false)
  end
end)

RegisterNUICallback('spawnWeapon', function(weapon, cb)
  debugPrint("Spawning weapon: " .. weapon)
  local playerPed = PlayerPedId()
  local weaponHash = GetHashKey(weapon)
  GiveWeaponToPed(playerPed, weaponHash, 500, false, true)
  cb({})
end)

-- CB From Menu
RegisterNUICallback('spawnVehicle', function(data, cb)
  local model = data.model
  if not IsModelValid(model) then
    debugPrint("^1Invalid vehicle model requested: " .. model)
    cb({ e = true })
  else
    TriggerServerEvent('txAdmin:menu:spawnVehicle', model)
    cb({})
  end
end)

-- CB From Menu
RegisterNUICallback('healPlayer', function(data, cb)
  TriggerServerEvent('txAdmin:menu:healPlayer', data.id)
  cb({})
end)

RegisterNUICallback('healMyself', function(_, cb)
  TriggerServerEvent('txAdmin:menu:healMyself')
  cb({})
end)

RegisterNUICallback('healAllPlayers', function(_, cb)
  TriggerServerEvent('txAdmin:menu:healAllPlayers')
  cb({})
end)

-- CB From Menu
-- Data will be an object with a message attribute
RegisterNUICallback('sendAnnouncement', function(data, cb)
  debugPrint(data.message)
  TriggerServerEvent('txAdmin:menu:sendAnnouncement', data.message)
  cb({})
end)

RegisterNetEvent('txAdmin:receiveAnnounce', function(message)
  sendMenuMessage('addAnnounceMessage', { message = message })
end)

RegisterNUICallback('fixVehicle', function(_, cb)
  local ped = PlayerPedId()
  local veh = GetVehiclePedIsIn(ped, false)
  if (veh == 0) then
    return cb({ e = true })
  end

  TriggerServerEvent('txAdmin:menu:fixVehicle')
  cb({})
end)

-- Used to trigger the help alert
AddEventHandler('playerSpawned', function()
  Wait(60000)
  if menuIsAccessible then
    sendMenuMessage('showMenuHelpInfo', {})
  end
end)

--[[ Reauth ]]
RegisterNetEvent('txAdmin:menu:reAuth', function()
  menuIsAccessible = false
  sendMenuMessage('reAuth')
end)

if debugModeEnabled then
  -- Debugging command
  RegisterCommand('txAdmin-reauth', function()
    print("re-authing")
    TriggerEvent('txAdmin:menu:reAuth')
  end)
end

--[[ Player list sync ]]
RegisterNetEvent('txAdmin:menu:setPlayerState', function(data)
  -- process data to add distance, remove pos
  for i in ipairs(data) do
    local row = data[i]
    local targetVec = vec3(row.pos.x, row.pos.y, row.pos.z)
    local dist = #(GetEntityCoords(PlayerPedId()) - targetVec)
      
    -- calculate the vehicle status
    local vehicleStatus = 'walking'
    if row.veh then
      local vehEntity = NetToVeh(row.veh)
      if not vehEntity or vehEntity == 0 then
        vehicleStatus = 'unknown'
      else
        local vehClass = GetVehicleClass(vehEntity)
        if vehClass == 8 then
          vehicleStatus = 'biking'
        elseif vehClass == 14 then
          vehicleStatus = 'boating'
          --elseif vehClass == 15 then
          --  vehicleStatus = 'floating'
          --elseif vehClass == 16 then
          --  vehicleStatus = 'flying'
        else
          vehicleStatus = 'driving'
        end
      end
    end
    
    row.vehicleStatus = vehicleStatus
    row.distance = dist
    -- remove unneeded values
    row.pos = nil
    row.veh = nil
  end

  debugPrint(json.encode(data))
  SendNUIMessage({
    action = 'setPlayerState',
    data = data
  })
end)

--[[ Teleport the player to the coordinates ]]
---@param x number
---@param y number
---@param z number
RegisterNetEvent('txAdmin:menu:tpToCoords', function(x, y, z)
  local ped = PlayerPedId()
  lastTp = GetEntityCoords(ped)
  
  DoScreenFadeOut(200)
  while not IsScreenFadedOut() do Wait(1) end
  
  debugPrint('Teleporting to coords')
  if z == 0 then
    for i = 0, 1000, 10 do
      SetPedCoordsKeepVehicle(ped, x, y, i)
      local zFound, _z = GetGroundZFor_3dCoord(x + 0.0, y + 0.0, i + 0.0)
      if zFound then
        debugPrint("3D ground found: " .. json.encode({ zFound, _z }))
        z = _z
        break
      end
      Wait(0)
    end
  end
  RequestCollisionAtCoord(x, y, z)
  RequestAdditionalCollisionAtCoord(x, y, z)
  SetPedCoordsKeepVehicle(ped, x, y, z)
  DoScreenFadeIn(500)
  SetGameplayCamRelativeHeading(0)
end)

-- [[ Teleport to the current waypoint ]]
RegisterNetEvent('txAdmin:menu:tpToWaypoint', function()
  local waypoint = GetFirstBlipInfoId(GetWaypointBlipEnumId())
  if waypoint and waypoint > 0 then
    local ped = PlayerPedId()
    lastTp = GetEntityCoords(ped)
    
    DoScreenFadeOut(200)
    while not IsScreenFadedOut() do Wait(1) end
    
    local blipCoords = GetBlipInfoIdCoord(waypoint)
    debugPrint("waypoint blip: " .. json.encode(blipCoords))
    local x = blipCoords[1]
    local y = blipCoords[2]
    local z = blipCoords[3]
    for i = 0, 1000, 10 do
      SetPedCoordsKeepVehicle(ped, x, y, i)
      local zFound, _z = GetGroundZFor_3dCoord(x, y, i + 0.0)
      if zFound then
        debugPrint("3D ground found: " .. json.encode({ zFound, _z }))
        z = _z
        break
      end
      Wait(0)
    end
    RequestCollisionAtCoord(x, y, z)
    RequestAdditionalCollisionAtCoord(x, y, z)
    SetPedCoordsKeepVehicle(ped, x, y, z)
    DoScreenFadeIn(500)
    SetGameplayCamRelativeHeading(0)
  else
    sendSnackbarMessage("error", "You have no waypoint set!")
  end
end)

--[[ Heal all players ]]
RegisterNetEvent('txAdmin:menu:healed', function()
  debugPrint('Received heal event, healing to full')
  local ped = PlayerPedId()
  local pos = GetEntityCoords(ped)
  if IsEntityDead(ped) then
    ResurrectPed(ped)
    ped = PlayerPedId()
    SetEntityCoords(ped, pos[1], pos[2], pos[3])
  end
  SetEntityHealth(ped, GetEntityMaxHealth(ped))
end)

--[[ Repair vehicle ]]
RegisterNetEvent('txAdmin:menu:fixVehicle', function()
  local ped = PlayerPedId()
  local veh = GetVehiclePedIsIn(ped, false)
  if veh and veh > 0 then
    SetVehicleUndriveable(veh, false)
    SetVehicleFixed(veh)
    SetVehicleEngineOn(veh, true, false)
    SetVehicleDirtLevel(veh, 0.0)
    SetVehicleOnGroundProperly(veh)
  end
end)

--[[ Spawn vehicles, with support for entity lockdown ]]
RegisterNetEvent('txAdmin:menu:spawnVehicle', function(netID)
  debugPrint(json.encode({ netID = netID }))
  SetNetworkIdExistsOnAllMachines(netID, true)
  SetNetworkIdCanMigrate(netID, true)
  
  -- get current veh and speed
  local ped = PlayerPedId()
  local oldVeh = GetVehiclePedIsIn(ped, false)
  local oldVel = DoesEntityExist(oldVeh) and GetEntitySpeed(oldVeh) or 0.0
  
  -- only delete if the new vehicle is found
  if oldVeh and IsPedInVehicle(ped, oldVeh, true) then
    debugPrint("Deleting existing vehicle (" .. oldVeh .. ")")
    SetEntityAsMissionEntity(oldVeh, true, true)
    DeleteVehicle(oldVeh)
  end
  
  local tries = 0
  while NetworkGetEntityFromNetworkId(netID) == 0 do
    if tries > 50 then
      debugPrint("^1Vehicle (net ID " .. netID .. ") did not become networked for this client in time ("
              .. (tries * 25) .. "ms)")
      return
    end
    debugPrint("Waiting for vehicle networking...")
    tries = tries + 1
    Wait(50)
  end
  
  local veh = NetworkGetEntityFromNetworkId(netID)
  debugPrint("Found networked vehicle " .. netID .. " (entity " .. veh .. ")")
  SetVehicleHasBeenOwnedByPlayer(veh, true)
  TaskWarpPedIntoVehicle(ped, veh, -1)
  SetEntityHeading(veh, GetEntityHeading(ped))
  if oldVel > 0.0 then
    SetVehicleEngineOn(veh, true, true, false)
    SetVehicleForwardSpeed(veh, oldVel)
  end
end)

local isRDR = not TerraingridActivate and true or false
local dismissKey = isRDR and 0xD9D0E1C0 or 22
local dismissKeyGroup = isRDR and 1 or 0

local function openWarningHandler(author, reason)
  sendMenuMessage('setWarnOpen', {
    reason = reason,
    warnedBy = author
  })

  CreateThread(function()
    local countLimit = 100 --10 seconds
    local count = 0
    while true do
      Wait(100)
      if IsControlPressed(dismissKeyGroup, dismissKey) then
        count = count +1
        if count >= countLimit then
          sendMenuMessage('closeWarning')
          return
        elseif math.fmod(count, 10) == 0 then
          sendMenuMessage('pulseWarning')
        end
      else
        count = 0
      end
    end
  end)
end

CreateThread(function()
  while true do
    if isMenuVisible and IsPauseMenuActive() then
      toggleVisibility()
    end
    Wait(250)
  end
end)

RegisterNetEvent('txAdminClient:warn', openWarningHandler)
