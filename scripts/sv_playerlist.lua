-- =============================================
--  Server PlayerList handler
-- =============================================

--Check Environment
if GetConvar('txAdminServerMode', 'false') ~= 'true' then
    return
end
local oneSyncConvar = GetConvar('onesync', 'off')
local onesyncEnabled = oneSyncConvar == 'on' or oneSyncConvar == 'legacy'

-- Variables
local intervalUpdateTime = 5000 --FIXME: use convar
local epochDuration = 30 --FIXME: use convar, seconds
local epochTimestamp = 0
local epochData = {}
local epochDiff = false
local respCacheEpoch = false --json cache
local respCacheDiff = false --json cache
local disconnectedAfterEpoch = {} --the ID of the ones that disconnected between epochs
local playerSelfReportData = {}
TX_PLAYERLIST = {} -- available globally in tx, is always updated

-- Optimizations
local ceil = math.ceil
local max = math.max
local min = math.min
local sub = string.sub
local len = string.len
local tonumber = tonumber
local tostring = tostring
local pairs = pairs


--[[ Emit player list to clients ]]
CreateThread(function()
    while true do
        Wait(intervalUpdateTime)
        local rightNow = os.time()
        local tmpPlayerlist = {}
        local tmpPlayerlistDiff = {}
        local shouldDiff = (rightNow - epochTimestamp < epochDuration)
        if not shouldDiff then
            disconnectedAfterEpoch = {}
        end

        -- For each player
        local players = GetPlayers()
        for _, serverID in pairs(players) do
            -- defaults
            local health = 0
            local coords = -1
            local vehClass = 'unknown'

            -- from self-report
            if type(playerSelfReportData[serverID]) == 'table' then
                vehClass = playerSelfReportData[serverID].vehClass or vehClass
                health = playerSelfReportData[serverID].health or health
                coords = playerSelfReportData[serverID].coords or coords
            end

            -- from server
            if onesyncEnabled == true then
                local ped = GetPlayerPed(serverID)
                health = ceil(((GetEntityHealth(ped) - 100) / 100) * 100)
                coords = GetEntityCoords(ped) or -1
            end

            -- Updating TX_PLAYERLIST
            if type(TX_PLAYERLIST[serverID]) ~= 'table' then
                TX_PLAYERLIST[serverID] = {
                    name = sub(GetPlayerName(serverID) or "unknown", 1, 75),
                    ids = GetPlayerIdentifiers(serverID),
                    h = health,
                    c = coords,
                    v = vehClass,
                }
            else
                TX_PLAYERLIST[serverID].h = health
                TX_PLAYERLIST[serverID].c = coords
                TX_PLAYERLIST[serverID].v = vehClass
            end

            -- We actually need this locally, can't do tmpPlayerlist[serverID] = TX_PLAYERLIST[serverID]  
            tmpPlayerlist[serverID] = {
                name = TX_PLAYERLIST[serverID].name,
                ids = TX_PLAYERLIST[serverID].ids,
                h = TX_PLAYERLIST[serverID].h,
                c = TX_PLAYERLIST[serverID].c,
                v = TX_PLAYERLIST[serverID].v,
            }

            -- Process the diff
            if shouldDiff then
                if type(epochData[serverID]) ~= 'table' then
                    tmpPlayerlistDiff[serverID] = tmpPlayerlist[serverID]
                else
                    local playerDiffData = {}
                    local anyChanged = false
                    if epochData[serverID].h ~= tmpPlayerlist[serverID].h then
                        anyChanged = true
                        playerDiffData.h = tmpPlayerlist[serverID].h
                    end
                    if epochData[serverID].c ~= tmpPlayerlist[serverID].c then
                        anyChanged = true
                        playerDiffData.c= tmpPlayerlist[serverID].c
                    end
                    if epochData[serverID].v ~= tmpPlayerlist[serverID].v then
                        anyChanged = true
                        playerDiffData.v = tmpPlayerlist[serverID].v
                    end

                    if anyChanged then
                        tmpPlayerlistDiff[serverID] = playerDiffData
                    end
                end
            end
            Wait(0)
        end --end for players

        --Applies the changes to epoch or diff and prepare cached json response
        if shouldDiff then
            debugPrint('Updating ^5epochDiff')
            epochDiff = tmpPlayerlistDiff
            for _, id in pairs(disconnectedAfterEpoch) do
                epochDiff[id] = false
            end
            respCacheDiff = json.encode({
                ts = epochTimestamp,
                diff = epochDiff
            })
        else
            debugPrint('Updating ^1epochData')
            epochDiff = false;
            epochTimestamp = rightNow;
            epochData = tmpPlayerlist;
            respCacheDiff = false
        end

        respCacheEpoch = json.encode({
            ts = epochTimestamp,
            data = epochData
        })

        -- DEBUG
        -- print(json.encode({
        --     ts = epochTimestamp;
        --     diff = epochDiff;
        --     data = epochData;
        -- }, {indent = true}))
        -- debugPrint("====================================")
    end --end while true
end)


--[[ Sets self-reported data ]]
local vehClassMap = {
    ["nil"] = "unknown",
    ["0"] = "walking",
    ["8"] = "biking",
    ["14"] = "boating",
    ["15"] = "flying", --heli
    ["16"] = "flying", --planes
}
RegisterNetEvent('txAdmin:selfDataReport', function(vehClass, health, coords)
    local s = source

    vehClass = tostring(vehClass)
    if vehClassMap[vehClass] ~= nil then
        vehClass = vehClassMap[vehClass]
    else
        vehClass = "driving"
    end

    if onesyncEnabled == true then
        playerSelfReportData[tostring(s)] = {
            vehClass = vehClass
        }
    else
        playerSelfReportData[tostring(s)] = {
            vehClass = vehClass,
            health = min(max(tonumber(health or -100), -100), 200),
            coords = coords or -1
        }
    end
end)


--[[ Handle player disconnects ]]
AddEventHandler('playerDropped', function()
    local s = tostring(source)
    TX_PLAYERLIST[s] = nil
    playerSelfReportData[s] = nil
    disconnectedAfterEpoch[#disconnectedAfterEpoch+1] = s
end)


--[[ Handle Playerlist HTTP Requests ]]
txHttpPlayerlistHandler = function(req, res)
    -- Sanity check
    if type(req.headers['x-txadmin-token']) ~= 'string' or len(req.headers['x-txadmin-token']) ~= 20 then
        return res.send(json.encode({error = 'token not found or invalid length'}))
    end
    local reqToken = req.headers['x-txadmin-token']

    -- Perms check
    if not (debugModeEnabled and reqToken == 'xxxx_Debug_Token_xxx') then
        local allow = false
        for id, admin in pairs(ADMIN_DATA) do
            if reqToken == admin.token then
                allow = true
                break
            end
        end
        if not allow then
            return res.send(json.encode({error = 'no admin for the provided token'}))
        end
    end

    -- Sending response
    local reqEpoch = req.headers['x-txadmin-epoch']
    if reqEpoch == tostring(epochTimestamp) and respCacheDiff then
        return res.send(respCacheDiff)
    else
        return res.send(respCacheEpoch)
    end
end
