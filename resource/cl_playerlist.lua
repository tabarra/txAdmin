-- =============================================
--  Client PlayerList handler
-- =============================================
if (GetConvar('txAdmin-menuEnabled', 'false') ~= 'true') then
    return
end

-- Optimizations
local tonumber = tonumber
local tostring = tostring
local floor = math.floor

-- Variables & Consts
LOCAL_PLAYERLIST = {} -- available globally in tx
local vTypeMap = {
    ["0"] = "walking",
    ["1"] = "driving", --automobile
    ["2"] = "biking",
    ["3"] = "boating",
    ["4"] = "flying", --heli
    ["5"] = "flying", --plane
    ["6"] = "boating", --submarine
    ["7"] = "driving", --trailer
    ["8"] = "driving", --train
}


-- Transforms the playerlist and sends to react
-- The playerlist is converted to an object array to save refactor time
function sendReactPlayerlist()
    local upload = {}
    for pids, playerData in pairs(LOCAL_PLAYERLIST) do
        upload[#upload + 1] = {
            id = tonumber(pids),
            name = playerData.name or "unknown",
            health = playerData.health,
            dist = playerData.dist,
            vType = playerData.vType,
            admin = playerData.admin
        }
    end
    -- print("========== function sendReactPlayerlist()")
    -- print(json.encode(upload))
    -- print("------------------------------------")
    sendMenuMessage('setPlayerList', upload)
end


-- Triggered when the admin authenticates
-- Replaces current playerlist
RegisterNetEvent('txcl:setInitialPlayerlist', function(payload)
    -- print("========== EVENT setInitialPlayerlist")
    -- print(json.encode(payload)) -- [[id, name]]
    -- print("------------------------------------")
    LOCAL_PLAYERLIST = {}
    for _, playerData in pairs(payload) do
        local pids = tostring(playerData[1])
        LOCAL_PLAYERLIST[pids] = {
            name = playerData[2],
            health = 0,
            dist = -1,
            vType = "unknown",
            admin = false
        }
    end
    -- print("------------------------------------")
    -- print(json.encode(LOCAL_PLAYERLIST, {indent = true}))
    -- print("------------------------------------")
    sendReactPlayerlist()
end)


-- Triggered on the return of "getDetailedPlayerlist"
--  > run through inbound playerlist updating existing data
--  > try to get the dist from all players (susceptible to area culling, but that's fine)
--  > TODO: decide what to do in case of missing or extra ids (missed updatePlayer?)
RegisterNetEvent('txcl:setDetailedPlayerlist', function(players, admins)
    -- print("========== EVENT setDetailedPlayerlist")
    -- print(json.encode(players)) -- [[id, health, vType]]
    -- print("------------------------------------")
    local myID = GetPlayerServerId(PlayerId())
    local myCoords = GetEntityCoords(PlayerPedId())

    for _, playerData in pairs(players) do
        local pid = playerData[1]
        local pids = tostring(playerData[1])
        local localPlayer = LOCAL_PLAYERLIST[pids]
        -- Set inbound data
        if localPlayer == nil then
            debugPrint("Playerlist: received detailed info for player "..pids.." not present in local playerlist")
            LOCAL_PLAYERLIST[pids] = {
                name = "unknown",
                health = playerData[2],
                vType = vTypeMap[tostring(playerData[3])] or "unknown",
                admin = false
            }
        else
            LOCAL_PLAYERLIST[pids].health = playerData[2]
            LOCAL_PLAYERLIST[pids].vType = vTypeMap[tostring(playerData[3])] or "unknown"
        end

        --Getting distance
        if pid == myID then
            LOCAL_PLAYERLIST[pids].dist = 0
        else
            local remotePlayer = GetPlayerFromServerId(pid)
            if remotePlayer == -1 then
                LOCAL_PLAYERLIST[pids].dist = -1
            else
                local remotePed = GetPlayerPed(remotePlayer)
                local remoteCoords = GetEntityCoords(remotePed)
                LOCAL_PLAYERLIST[pids].dist = floor(#(myCoords - remoteCoords))
            end
        end
    end

    -- Mark admins
    for _, adminID in pairs(admins) do
        local id = tostring(adminID)
        if LOCAL_PLAYERLIST[id] ~= nil then
            LOCAL_PLAYERLIST[id].admin = true
        end
    end

    -- print("------------------------------------")
    -- print(json.encode(LOCAL_PLAYERLIST, {indent = true}))
    -- print("------------------------------------")
    sendReactPlayerlist()
end)


-- Triggered on player join/leave
-- add/remove specific id to playerlist
RegisterNetEvent('txcl:updatePlayer', function(id, data)
    local pids = tostring(id)
    if data == false then
        debugPrint("^2txcl:updatePlayer: ^3"..id.."^2 disconnected")
        LOCAL_PLAYERLIST[pids] = nil
    else
        debugPrint("^2txcl:updatePlayer: ^3"..id.."^2 connected")
        LOCAL_PLAYERLIST[pids] = {
            name = data,
            health = 0,
            dist = -1,
            vType = "unknown",
            admin = false
        }
    end
    sendReactPlayerlist()
end)


-- Triggered when the "player" tab opens in the menu, and every 5s after that
RegisterNUICallback('signalPlayersPageOpen', function(_, cb)
    TriggerServerEvent("txsv:getDetailedPlayerlist") --request latest from server
    cb({})
end)


-- DEBUG only
-- RegisterCommand('tnew', function()
--     TriggerServerEvent("txsv:getDetailedPlayerlist")
-- end)
-- RegisterCommand('tprint', function()
--     print("------------------------------------")
--     print(json.encode(LOCAL_PLAYERLIST, {indent = true}))
--     print("------------------------------------")
-- end)
