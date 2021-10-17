-- =============================================
--  Client PlayerList handler
-- =============================================
LOCAL_PLAYERLIST = {} -- available globally in tx
local vTypeMap = {
    ["0"] = "walking",
    ["1"] = "driving", --automobile
    ["2"] = "biking",
    ["3"] = "boating",
    ["4"] = "flying", --heli
    ["5x"] = "flying", --plane
    ["6"] = "boating", --submarine
    ["7"] = "driving", --trailer
    ["8"] = "driving", --train
}


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
            dist = 0,
            vType = "unknown"
        }
    end
    -- print("------------------------------------")
    -- print(json.encode(LOCAL_PLAYERLIST, {indent = true}))
    -- print("------------------------------------")
    sendMenuMessage('setPlayerlist', LOCAL_PLAYERLIST)
end)


-- Triggered on the return of "getDetailedPlayerlist"
--  > run through inbound playerlist updating existing data
--  > try to get the dist from all players (susceptible to area culling, but that's fine)
--  > TODO: decide what to do in case of missing or extra ids (missed updatePlayer?)
RegisterNetEvent('txcl:setDetailedPlayerlist', function(payload)
    -- print("========== EVENT setDetailedPlayerlist")
    -- print(json.encode(payload)) -- [[id, health, vType]]
    -- print("------------------------------------")
    local myID = GetPlayerServerId(PlayerId())
    local myCoords = GetEntityCoords(PlayerPedId())

    for _, playerData in pairs(payload) do
        local pid = playerData[1]
        local pids = tostring(playerData[1])
        local admin = LOCAL_PLAYERLIST[pids]
        -- Set inbound data
        if admin == nil then
            debugPrint("Playerlist: received detailed info for player "..pids.." not present in local playerlist")
            LOCAL_PLAYERLIST[pids] = {
                name = "unknown",
                health = playerData[2],
                vType = vTypeMap[tostring(playerData[3])] or "unknown"
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
                LOCAL_PLAYERLIST[pids].dist = #(myCoords - remoteCoords)
            end
        end
    end

    -- print("------------------------------------")
    -- print(json.encode(LOCAL_PLAYERLIST, {indent = true}))
    -- print("------------------------------------")
    sendMenuMessage('setPlayerlist', LOCAL_PLAYERLIST)
end)


-- Triggered on player join/leave
-- add/remove specific id to playerlist
RegisterNetEvent('txcl:updatePlayer', function(id, data)
    -- print("========== EVENT updatePlayer")
    -- print(json.encode({id, data}))
    local pids = tostring(id)
    if data == false then
        LOCAL_PLAYERLIST[pids] = nil
    else
        LOCAL_PLAYERLIST[pids] = {
            name = data,
            health = 0,
            dist = 0,
            vType = "unknown"
        }
    end
    sendMenuMessage('setPlayerlist', LOCAL_PLAYERLIST)
end)


-- Triggered when the "player" tab opens in the menu, and every 5s after that
RegisterNUICallback('getPlayerlist', function(_, cb)
    sendMenuMessage('setPlayerlist', LOCAL_PLAYERLIST) --send outdated to NUI
    TriggerServerEvent("txsv:getDetailedPlayerlist") --request latest from server
    cb({})
end)


-- DEBUG only
RegisterCommand('tnew', function()
    TriggerServerEvent("txsv:getDetailedPlayerlist")
end)
RegisterCommand('tprint', function()
    print("------------------------------------")
    print(json.encode(LOCAL_PLAYERLIST, {indent = true}))
    print("------------------------------------")
end)
-- CreateThread(function()
--     while true do
--         TriggerServerEvent("txsv:getDetailedPlayerlist")
--         Wait(2500)
--     end
-- end)
