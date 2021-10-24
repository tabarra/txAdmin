-- =============================================
--  Server PlayerList handler
-- =============================================
--Check Environment
if GetConvar('txAdminServerMode', 'false') ~= 'true' then
   return
end
local oneSyncConvar = GetConvar('onesync', 'off')
local onesyncEnabled = oneSyncConvar == 'on' or oneSyncConvar == 'legacy'


-- Optimizations
local floor = math.floor
local max = math.max
local min = math.min
local sub = string.sub
local tonumber = tonumber
local tostring = tostring
local pairs = pairs


-- Variables & Consts
TX_PLAYERLIST = {} -- available globally in tx
local refreshMinDelay = 1500
local refreshMaxDelay = 5000
local maxPlayersDelayCeil = 300 --at this number, the delay won't increase more
local intervalYieldLimit = 50
local vTypeMap = {
    ["nil"] = -1,
    ["walking"] = 0,
    ["automobile"] = 1,
    ["bike"] = 2,
    ["boat"] = 3,
    ["heli"] = 4,
    ["plane"] = 5,
    ["submarine"] = 6,
    ["trailer"] = 7,
    ["train"] = 8,
}


--[[ Refresh player list data ]]
CreateThread(function()
    while true do
        -- For each player
        local players = GetPlayers()
        for yieldCounter, serverID in pairs(players) do
            -- Updating player vehicle/health
            -- NOTE: after testing this seem not to need any error handling
            local health = 0
            local vType = -1
            if onesyncEnabled == true then
                local ped = GetPlayerPed(serverID)
                local veh = GetVehiclePedIsIn(ped)
                if veh ~= 0 then
                    vType = vTypeMap[tostring(GetVehicleType(veh))]
                else
                    vType = vTypeMap["walking"]
                end
                health = min(max(GetEntityHealth(ped), 0), 200)
            end

            -- Updating TX_PLAYERLIST
            if type(TX_PLAYERLIST[serverID]) ~= 'table' then
                TX_PLAYERLIST[serverID] = {
                    name = sub(GetPlayerName(serverID) or "unknown", 1, 75),
                    health = health,
                    vType = vType,
                }
            else
                TX_PLAYERLIST[serverID].health = health
                TX_PLAYERLIST[serverID].vType = vType
            end

            -- Mark as refreshed
            TX_PLAYERLIST[serverID].foundLastCheck = true

            -- Yield to prevent hitches
            if yieldCounter % intervalYieldLimit == 0 then
                Wait(0)
            end
        end --end for players


        --Check if player disconnected
        for playerID, playerData in pairs(TX_PLAYERLIST) do
            if playerData.foundLastCheck == true then
                playerData.foundLastCheck = false
            else
                TX_PLAYERLIST[playerID] = nil
            end
        end
       
        -- DEBUG
        -- debugPrint("====================================")
        -- print(json.encode(TX_PLAYERLIST, {indent = true}))
        -- debugPrint("====================================")

        -- Refresh interval with linear function
        local hDiff = refreshMaxDelay - refreshMinDelay
        local calcDelay = (hDiff/maxPlayersDelayCeil) * (#players) + refreshMinDelay
        local delay = floor(min(calcDelay, refreshMaxDelay))
        Wait(delay)
    end --end while true
end)


--[[ Handle player Join or Leave ]]
AddEventHandler('playerJoining', function()
    local playerName = sub(GetPlayerName(source) or "unknown", 1, 75)
    for adminID, _ in pairs(ADMIN_DATA) do
        TriggerClientEvent('txcl:updatePlayer', adminID, source, playerName)
    end
end)
AddEventHandler('playerDropped', function()
    for adminID, _ in pairs(ADMIN_DATA) do
        TriggerClientEvent('txcl:updatePlayer', adminID, source, false)
    end
end)


-- Handle getDetailedPlayerlist
-- This event is only called when the meny "players" tab is opened, and every 5s while the tab is open
RegisterNetEvent('txsv:getDetailedPlayerlist', function()
    if ADMIN_DATA[tostring(source)] == nil then
        debugPrint('Ignoring unauthenticated getDetailedPlayerlist() by ' .. source)
        return
    end

    local payload = {}
    for playerID, playerData in pairs(TX_PLAYERLIST) do
        payload[#payload + 1] = {tonumber(playerID), playerData.health, playerData.vType}
    end
    TriggerClientEvent('txcl:setDetailedPlayerlist', source, payload)
end)


-- Sends the initial playlist to a specific admin
-- Triggered by the server after admin auth
function sendInitialPlayerlist(adminID)
    local payload = {}
    for playerID, playerData in pairs(TX_PLAYERLIST) do
        payload[#payload + 1] = {tonumber(playerID), playerData.name}
    end
    debugPrint('Sending initial playerlist to ' .. adminID)
    TriggerClientEvent('txcl:setInitialPlayerlist', adminID, payload)
end
