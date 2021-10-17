--Check Environment
if GetConvar('txAdminServerMode', 'false') ~= 'true' then
  return
end

-- =============================================
--  This file is for server side logic relating to
--  player list dispatching and diffing for events
-- =============================================

local EMIT_BITRATE = 30000
LAST_PLAYER_DATA = {}

--[[ Emit player list to clients ]]
-- How many MS is the interval for the update time
-- Up this to bump client performance at the cost of player page updates
local INTERVAL_UPDATE_TIME = GetConvarInt('txAdminMenu-updateInterval', 5000)

local function getPlayersLicense(src)
  for _, v in ipairs(GetPlayerIdentifiers(src)) do
    if string.sub(v, 1, string.len("license:")) == "license:" then
      return v:sub(string.len("license:") + 1)
    end
  end
end

---@param id string
---@param data table|nil
function sendFullClientData(id, data)
  data = data or LAST_PLAYER_DATA
  -- TriggerLatentClientEvent('txAdmin:menu:setPlayerState', id, EMIT_BITRATE, data)
  TriggerClientEvent('txAdmin:menu:setPlayerState', id, data)
end



-- FIXME: old playerlist, remove
CreateThread(function()
  local ceil = math.ceil
  local sub = string.sub
  local pairs = pairs

  while true do
    Wait(INTERVAL_UPDATE_TIME)

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