
-- Variable that determines whether a player can even access the menu
menuIsAccessible = false
isMenuDebug = false

local SoundEnum = {
  move = 'NAV_UP_DOWN',
  enter = 'SELECT'
}

CreateThread(function()
  isMenuDebug = (GetConvar('txAdminMenu-debugMode', 'false') == 'true')
end)

local isRDR = not TerraingridActivate and true or false
local dismissKey = isRDR and 0xD9D0E1C0 or 22
local dismissKeyGroup = isRDR and 1 or 0


--- Send data to the NUI frame
---@param action string Action
---@param data any Data corresponding to action
function sendMenuMessage(action, data)
  SendNUIMessage({
    action = action,
    data = data
  })
end

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

RegisterNetEvent('txAdminClient:warn', openWarningHandler)


--BETA BETA BETA BETA BETA BETA BETA BETA BETA BETA BETA 
if (GetConvar('txEnableMenuBeta', 'false') ~= 'true') then
  print('txAdmin beta menu disabled.')
  return
end


-- Since the menu yields/receives keyboard
-- focus we need to store that the menu is already visible
local isMenuVisible
-- Last location stored in a vec3
local lastTp

function registerTxKeybinds()
  -- Only register keybinds for authed users
  if menuIsAccessible then
    RegisterKeyMapping('txadmin', 'Open the txAdmin Menu', 'keyboard', '')
    RegisterKeyMapping('txAdmin:menu:endSpectate', 'Exit spectate mode', 'keyboard', 'BACK')
  end
end

--[[ Reauth ]]
RegisterCommand('txAdmin-reauth', function()
  if debugModeEnabled then
    debugPrint("re-authing")
    TriggerEvent('txAdmin:menu:reAuth')
  end
end)
RegisterNetEvent('txAdmin:menu:reAuth', function()
  menuIsAccessible = false
  sendMenuMessage('reAuth')
end)

--[[ Enable debugging ]]
RegisterNetEvent('txAdmin:events:enableDebug', function(enabled)
  debugModeEnabled = enabled
end)

-- ===============
--  ServerCtx
-- ===============
local ServerCtx
--- Will update ServerCtx based on GlobalState and will send it to NUI
local function updateServerCtx()
  _ServerCtx = GlobalState.txAdminServerCtx
  if _ServerCtx == nil then
    debugPrint('^3ServerCtx fallback support activated')
    TriggerServerEvent('txAdmin:events:getServerCtx')
  else
    ServerCtx = _ServerCtx
  end
end

RegisterNetEvent('txAdmin:events:setServerCtx', function(ctx)
  if type(ctx) ~= 'table' then return end
  ServerCtx = ctx
  debugPrint('^2ServerCtx updated from server event')
end)

CreateThread(function()
  Wait(0)
  updateServerCtx()
  while ServerCtx == nil do Wait(0) end
  debugPrint(json.encode(ServerCtx))
  
  -- Dispatch ctx to React state
  sendMenuMessage('setServerCtx', ServerCtx)
end)

-- ===============
--  End ServerCtx
-- ===============

--- Snackbar message
---@param level string The severity of the message can be 'info', 'error', or 'warning'
---@param message string Message to display with snackbar
function sendSnackbarMessage(level, message, isTranslationKey)
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
function toggleMenuVisibility(visible)
  if (visible == true and isMenuVisible) or (visible == false and not isMenuVisible) then
    return
  end
  if visible == nil then
    if not isMenuVisible and IsPauseMenuActive() then
      return
    end
  end
  -- Lets update before we open the menu
  updateServerCtx()
  sendMenuMessage('setDebugMode', isMenuDebug)
  if visible ~= nil then
    isMenuVisible = visible
    sendMenuMessage('setVisible', visible)
  else
    isMenuVisible = not isMenuVisible
    sendMenuMessage('setVisible', isMenuVisible)
  end
  PlaySoundFrontend(-1, SoundEnum['enter'], 'HUD_FRONTEND_DEFAULT_SOUNDSET', 1)
end

-- Command to be used with the register key mapping
local function txadmin()
  if menuIsAccessible then
    toggleMenuVisibility()
  else
    sendSnackbarMessage('error', 'nui_menu.misc.menu_not_allowed', true)
  end
end
RegisterCommand('txadmin', txadmin)
RegisterCommand('tx', txadmin)

CreateThread(function()
  TriggerEvent('chat:removeSuggestion', '/txadmin')
  TriggerEvent('chat:removeSuggestion', '/tx')
end)
-- end commands


--[[
  NUI Callbacks from the menu
 ]]

-- Triggered whenever we require full focus, cursor and keyboard
RegisterNUICallback('focusInputs', function(shouldFocus, cb)
  -- Will prevent mouse focus on initial menu mount as the useEffect emits there
  if not isMenuVisible then
    return
  end
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
  TriggerServerEvent('txAdmin:menu:tpToPlayer', tonumber(data.id))
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
  TriggerServerEvent('txAdmin:menu:summonPlayer', tonumber(data.id))
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

local freecamVeh = 0
local function toggleFreecam(enabled)
  local ped = PlayerPedId()
  SetEntityVisible(ped, not enabled)
  SetPlayerInvincible(ped, enabled)
  FreezeEntityPosition(ped, enabled)
  
  if enabled then
    freecamVeh = GetVehiclePedIsIn(ped, false)
    if freecamVeh > 0 then
      NetworkSetEntityInvisibleToNetwork(freecamVeh, true)
      SetEntityCollision(freecamVeh, false, false)
    end
  end
  
  local function enableNoClip()
    lastTp = GetEntityCoords(ped)
    
    SetFreecamActive(true)
    StartFreecamThread()
    
    Citizen.CreateThread(function()
      while IsFreecamActive() do
        SetEntityLocallyInvisible(ped)
        if freecamVeh > 0 then
          if DoesEntityExist(freecamVeh) then
            SetEntityLocallyInvisible(freecamVeh)
          else
            freecamVeh = 0
          end
        end
        Wait(0)
      end
      
      if not DoesEntityExist(freecamVeh) then
        freecamVeh = 0
      end
      if freecamVeh > 0 then
        local coords = GetEntityCoords(ped)
        NetworkSetEntityInvisibleToNetwork(freecamVeh, false)
        SetEntityCollision(freecamVeh, true, true)
        SetEntityCoords(freecamVeh, coords[1], coords[2], coords[3])
        SetPedIntoVehicle(ped, freecamVeh, -1)
        freecamVeh = 0
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

RegisterNUICallback('copyCurrentCoords', function(_, cb)
  local curCoords = GetEntityCoords(PlayerPedId())
  -- We will cut coords to 4 decimal points
  local stringCoords = ('%.4f, %.4f, %.4f'):format(curCoords.x, curCoords.y, curCoords.z)
  cb({ coords = stringCoords })
end)

-- [[ Player mode changed cb event ]]
RegisterNetEvent('txAdmin:menu:playerModeChanged', function(mode)
  if mode == 'godmode' then
    toggleFreecam(false)
    toggleGodMode(true)
  elseif mode == 'noclip' then
    toggleGodMode(false)
    toggleFreecam(true)
  elseif mode == 'none' then
    toggleFreecam(false)
    toggleGodMode(false)
  end
end)

-- [[ Spawn weapon (only in dev, for now) ]]
if isMenuDebug then
  RegisterNUICallback('spawnWeapon', function(weapon, cb)
    debugPrint("Spawning weapon: " .. weapon)
    GiveWeaponToPed(PlayerPedId(), weapon, 500, false, true)
    cb({})
  end)
end

-- CB From Menu
local oldVehVelocity = 0.0
RegisterNUICallback('spawnVehicle', function(data, cb)
  if type(data) ~= 'table' then error("Invalid spawnVehicle NUI callback data") end
  local model = data.model
  if type(model) ~= 'string' then return end
  if not IsModelValid(model) or not IsModelAVehicle(model) then
    debugPrint("^1Invalid vehicle model requested: " .. model)
    cb({ e = true })
  else
    local isAutomobile = IsThisModelACar(model)
    if isAutomobile ~= false then isAutomobile = true end
    
    -- collect the old velocity
    local ped = PlayerPedId()
    local oldVeh = GetVehiclePedIsIn(ped, false)
    if oldVeh and oldVeh > 0 then
      oldVehVelocity = GetEntityVelocity(oldVeh)
      DeleteVehicle(oldVeh)
    end
    
    TriggerServerEvent('txAdmin:menu:spawnVehicle', model, isAutomobile)
    cb({})
  end
end)

-- CB From Menu
RegisterNUICallback('healPlayer', function(data, cb)
  TriggerServerEvent('txAdmin:menu:healPlayer', tonumber(data.id))
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

  
--[[ Player list sync ]]
local posCache = {}
local vehCache = {}
RegisterNetEvent('txAdmin:menu:setPlayerState', function(data)
  local NetToVeh = NetToVeh
  local GetVehicleClass = GetVehicleClass
  
  if type(data) ~= 'table' then
    print("^1Invalid player state data provided (was type: " .. type(data) .. ")")
    return
  end
  
  -- process data to add distance, remove pos
  local pedCoords = GetEntityCoords(PlayerPedId())
  local fullData = {}
  for _, row in pairs(data) do
    local serverId = row.i
    if type(row.c) == 'vector3' or type(row.c) == 'number' then posCache[serverId] = row.c end
    if type(row.v) == 'number' then vehCache[serverId] = row.v end
    local pos = posCache[serverId]
    local veh = vehCache[serverId]
    local dist
    if pos ~= nil and pos ~= -1 and type(pos) == 'vector3' then
      local targetVec = vec3(pos[1], pos[2], pos[3])
      dist = #(pedCoords - targetVec)
    else
      dist = -1
    end
    
    -- calculate the vehicle status
    local vehicleStatus = 'walking'
    if veh and veh > 0 then
      local vehEntity = NetToVeh(veh)
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
  
    fullData[#fullData + 1] = {
      id = tonumber(row.i),
      health = row.h,
      vehicleStatus = vehicleStatus,
      distance = dist,
      username = row.u,
      license = row.l
    }
  end
  
  debugPrint(("^2received ^3%d^2 players from state event"):format(#fullData))
  
  SendNUIMessage({
    action = 'setPlayerState',
    data = fullData
  })
end)
--[[ End player sync ]]

--- Calculate a safe Z coordinate based off the (X, Y)
---@param x number
---@param y number
---@return number|nil
local function FindZForCoords(x, y)
  local found = true
  local START_Z = 1500
  local z = START_Z
  while found and z > 0 do
    local _found, _z = GetGroundZFor_3dCoord(x + 0.0, y + 0.0, z - 1.0)
    if _found then
      z = _z + 0.0
    end
    found = _found
    Wait(0)
  end
  if z == START_Z then return nil end
  return z + 0.0
end

--[[ Teleport the player to the coordinates ]]
---@param x number
---@param y number
---@param z number
RegisterNetEvent('txAdmin:menu:tpToCoords', function(x, y, z)
  local ped = PlayerPedId()
  lastTp = GetEntityCoords(ped)
  
  DoScreenFadeOut(500)
  while not IsScreenFadedOut() do Wait(0) end
  ped = PlayerPedId()
  if z == 0 then
    local _z = FindZForCoords(x, y)
    if _z ~= nil then z = _z end
  end
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
    
    DoScreenFadeOut(500)
    while not IsScreenFadedOut() do Wait(0) end
    
    local blipCoords = GetBlipInfoIdCoord(waypoint)
    local x = blipCoords[1]
    local y = blipCoords[2]
    local z = 0
    local _z = FindZForCoords(x, y)
    if _z ~= nil then z = _z end
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
  local heading = GetEntityHeading(ped)
  if IsEntityDead(ped) then
    NetworkResurrectLocalPlayer(pos[1], pos[2], pos[3], heading, false, false)
  end
  ped = PlayerPedId()
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
RegisterNetEvent('txAdmin:events:queueSeatInVehicle', function(vehNetID, seat)
  if type(vehNetID) ~= 'number' then return end
  if type(seat) ~= 'number' then return end
  
  local tries = 0
  while not NetworkDoesEntityExistWithNetworkId(vehNetID) and tries < 1000 do Wait(0) end
  if tries >= 1000 then
    print("^1Failed to seat into vehicle (net=" .. vehNetID .. ")")
    return
  end
  
  local veh = NetToVeh(vehNetID)
  if veh and veh > 0 then
    SetPedIntoVehicle(PlayerPedId(), veh, seat)
    if seat == -1 then
      SetVehicleEngineOn(veh, true, true, false)
      SetEntityVelocity(veh, oldVehVelocity)
      --SetVehicleForwardSpeed(veh, #(oldVehVelocity[1] + oldVehVelocity[2]))
      SetVehicleOnGroundProperly(veh)
    end
  end
  oldVehVelocity = 0.0
end)


CreateThread(function()
  while true do
    if isMenuVisible and IsPauseMenuActive() then
      toggleMenuVisibility()
    end
    Wait(250)
  end
end)
