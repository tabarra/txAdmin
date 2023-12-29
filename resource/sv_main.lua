-- Prevent running in monitor mode
if not TX_SERVER_MODE then return end

--Helpers
local function logError(x)
    txPrint("^1" .. x)
end
function unDeQuote(x)
    local new, count = string.gsub(x, utf8.char(65282), '"')
    return new
end

if GetCurrentResourceName() ~= "monitor" then
    logError('This resource should not be installed separately, it already comes with fxserver.')
    return
end


-- =============================================
-- Variables stuff
-- =============================================
TX_ADMINS = {}
TX_PLAYERLIST = {}
TX_LUACOMHOST = GetConvar("txAdmin-luaComHost", "invalid")
TX_LUACOMTOKEN = GetConvar("txAdmin-luaComToken", "invalid")
TX_VERSION = GetResourceMetadata(GetCurrentResourceName(), 'version') -- for now, only used in the start print

-- Checking convars
if TX_LUACOMHOST == "invalid" or TX_LUACOMTOKEN == "invalid" then
    txPrint('^1API Host or Pipe Token ConVars not found. Do not start this resource if not using txAdmin.')
    return
end
if TX_LUACOMTOKEN == "removed" then
    txPrint('^1Please do not restart the monitor resource.')
    return
end

-- Erasing the token convar for security reasons, and then restoring it if debug mode.
-- The convar needs to be reset on first tick to prevent other resources from reading it.
-- We actually need to wait two frames: one for convar replication, one for debugPrint.
SetConvar("txAdmin-luaComToken", "removed")
CreateThread(function()
    Wait(0)
    if not TX_DEBUG_MODE then return end
    debugPrint("Restoring txAdmin-luaComToken for next monitor restart")
    SetConvar("txAdmin-luaComToken", TX_LUACOMTOKEN)
end)


-- vars
local rejectAllConnections = false
local hbReturnData = '{"error": "no data cached in sv_main.lua"}'


-- =============================================
-- Heartbeat functions
-- =============================================
local function HTTPHeartBeat()
    local url = "http://"..TX_LUACOMHOST.."/intercom/monitor"
    local exData = {
        txAdminToken = TX_LUACOMTOKEN
    }
    PerformHttpRequest(url, function(httpCode, data, resultHeaders)
        local resp = tostring(data)
        if httpCode ~= 200 then
            hbReturnData = "HeartBeat failed with code "..httpCode.." and message: "..resp
            logError(hbReturnData)
        else
            hbReturnData = resp
        end
    end, 'POST', json.encode(exData), {['Content-Type']='application/json'})
end

local function FD3HeartBeat()
    local payload = json.encode({type = 'txAdminHeartBeat'})
    PrintStructuredTrace(payload)
end

-- HTTP request handler
local function handleHttp(req, res)
    res.writeHead(200, {["Content-Type"]="application/json"})

    if req.path == '/stats.json' then
        return res.send(hbReturnData)
    else
        return res.send(json.encode({error = 'route not found'}))
    end
end


-- =============================================
-- Commands
-- =============================================

--- Simple stdout reply just to make sure the resource is alive
--- this is only used in debug
local function txaPing(source, args)
    txPrint("Pong! (txAdmin resource is running)")
    CancelEvent()
end


--- Kick all players
local function txaKickAll(source, args)
    if args[1] == nil then
        args[1] = 'no reason provided'
    else
        args[1] = unDeQuote(args[1])
    end
    txPrint("Kicking all players with reason: "..args[1])
    for _, pid in pairs(GetPlayers()) do
        DropPlayer(pid, "\n".."Kicked for: " .. args[1])
    end
    CancelEvent()
end


--- Get all resources/statuses and report back to txAdmin
local function txaReportResources(source, args)
    --Prepare resources list
    local resources = {}
    local max = GetNumResources() - 1
    for i = 0, max do
        local resName = GetResourceByFindIndex(i)

        -- Hacky patch added because a particular resource from this developer had a broken 
        -- unicode in the resource description, which caused json.encode to fail.
        local resDesc = GetResourceMetadata(resName, 'description')
        if resDesc ~= nil and string.find(resDesc, "Louis.dll") then
            resDesc = nil
        end

        local currentRes = {
            name = resName,
            status = GetResourceState(resName),
            author = GetResourceMetadata(resName, 'author'),
            version = GetResourceMetadata(resName, 'version'),
            description = resDesc,
            path = GetResourcePath(resName)
        }
        resources[#resources+1] = currentRes
    end

    --Send to txAdmin
    local url = "http://"..TX_LUACOMHOST.."/intercom/resources"
    local exData = {
        txAdminToken = TX_LUACOMTOKEN,
        resources = resources
    }
    txPrint('Sending resources list to txAdmin.')
    PerformHttpRequest(url, function(httpCode, data, resultHeaders)
        local resp = tostring(data)
        if httpCode ~= 200 then
            logError("ReportResources failed with code "..httpCode.." and message: "..resp)
        end
    end, 'POST', json.encode(exData), {['Content-Type']='application/json'})
end


--- Setter for the txAdmin-debugMode convar and TX_DEBUG_MODE global variable
local function txaSetDebugMode(source, args)
    -- prevent execution from admins or resources
    if source ~= 0 or GetInvokingResource() ~= nil then return end
    -- validating argument
    if args[1] == nil then return end

    -- changing mode
    if args[1] == '1' then
        TX_DEBUG_MODE = true
        txPrint("^1!! Debug Mode enabled via console !!")
    elseif args[1] == '0' then
        TX_DEBUG_MODE = false
        txPrint("^1!! Debug Mode disabled via console !!")
    else
        txPrint("^1!! txaSetDebugMode only accepts '1' or '0' as input. !!")
    end
    SetConvarReplicated('txAdmin-debugMode', tostring(TX_DEBUG_MODE))
    TriggerClientEvent('txcl:setDebugMode', -1, TX_DEBUG_MODE)
end


-- =============================================
--  Events handling
-- =============================================
local cvHideAnnouncement = GetConvarBool('txAdmin-hideDefaultAnnouncement')
local cvHideDirectMessage = GetConvarBool('txAdmin-hideDefaultDirectMessage')
local cvHideWarning = GetConvarBool('txAdmin-hideDefaultWarning')
local cvHideScheduledRestartWarning = GetConvarBool('txAdmin-hideDefaultScheduledRestartWarning')
local txaEventHandlers = {}

--- Handler for announcement events
--- Broadcast admin message to all players
txaEventHandlers.announcement = function(eventData)
    if not cvHideAnnouncement then
        TriggerClientEvent('txcl:showAnnouncement', -1, eventData.message, eventData.author)
    end
    TriggerEvent('txsv:logger:addChatMessage', 'tx', '(Broadcast) '..eventData.author, eventData.message)
end


--- Handler for scheduled restarts event
--- Broadcast through an announcement that the server will restart in XX minutes
txaEventHandlers.scheduledRestart = function(eventData)
    if not cvHideScheduledRestartWarning then
        TriggerClientEvent('txcl:showAnnouncement', -1, eventData.translatedMessage, 'txAdmin')
    end
    TriggerEvent('txsv:logger:addChatMessage', 'tx', '(Broadcast) txAdmin', eventData.translatedMessage)
end


--- Handler for player DM event
--- Sends a direct message from an admin to a player
txaEventHandlers.playerDirectMessage = function(eventData)
    if not cvHideDirectMessage then
        TriggerClientEvent('txcl:showDirectMessage', eventData.target, eventData.message, eventData.author)
    end
    TriggerEvent('txsv:logger:addChatMessage', 'tx', '(DM) '..eventData.author, eventData.message)
end


--- Handler for player kicked event
txaEventHandlers.playerKicked = function(eventData)
    Wait(0) -- give other resources a chance to read player data
    DropPlayer(eventData.target, '[txAdmin] ' .. eventData.reason)
end


--- Handler for player warned event
--- Warn specific player via server ID
txaEventHandlers.playerWarned = function(eventData)
    local pName = GetPlayerName(eventData.target)
    if pName ~= nil then
        if not cvHideWarning then
            TriggerClientEvent('txcl:showWarning', eventData.target, eventData.author, eventData.reason)
        end
        txPrint('Warning '..pName..' with reason: '..eventData.reason)
    else
        txPrint('handleWarnEvent: player not found')
    end
end


--- Handler for the player banned event
--- Ban player(s) via netid or identifiers
txaEventHandlers.playerBanned = function(eventData)
    Wait(0) -- give other resources a chance to read player data
    local kickCount = 0
    for _, playerID in pairs(GetPlayers()) do
        local identifiers = GetPlayerIdentifiers(playerID)
        if identifiers ~= nil then
            local found = false
            for _, searchIdentifier in pairs(eventData.targetIds) do
                if found then break end

                for _, playerIdentifier in pairs(identifiers) do
                    if searchIdentifier == playerIdentifier then
                        txPrint("handleBanEvent: Kicking #"..playerID..": "..eventData.reason)
                        kickCount = kickCount + 1
                        DropPlayer(playerID, '[txAdmin] ' .. eventData.kickMessage)
                        found = true
                        break
                    end
                end
            end
        end
    end

    if kickCount == 0 then
        txPrint("handleBanEvent: No players found to kick")
    end
end


--- Handler for the imminent shutdown event
--- Kicks all players and lock joins in preparation for server shutdown
txaEventHandlers.serverShuttingDown = function(eventData)
    txPrint('Server shutdown imminent. Kicking all players.')
    rejectAllConnections = true
    local players = GetPlayers()
    for _, serverID in pairs(players) do
        DropPlayer(serverID, '[txAdmin] ' .. eventData.message)
    end
end


--- Command that receives all incoming tx events and dispatches 
--- it to the respective event handler
local function txaEvent(source, args)
    -- sanity check
    if type(args[1]) ~= 'string' or type(args[2]) ~= 'string' then
        return logError('Invalid arguments for txaEvent')
    end
    -- prevent execution from admins or resources
    if source ~= 0 or GetInvokingResource() ~= nil then return end

    -- processing event
    local eventName = unDeQuote(args[1])
    local eventData = json.decode(unDeQuote(args[2]))
    TriggerEvent('txAdmin:events:' .. eventName, eventData)

    if txaEventHandlers[eventName] ~= nil then
        return txaEventHandlers[eventName](eventData)
    end
    CancelEvent()
end


-- =============================================
-- Player connecting handler
-- =============================================
local function handleConnections(name, setKickReason, d)
    -- if server is shutting down
    if rejectAllConnections then
        CancelEvent()
        setKickReason("[txAdmin] Server is shutting down, try again in a few seconds.")
        return
    end

    local player = source
    if GetConvarBool("txAdmin-checkPlayerJoin") then
        d.defer()
        Wait(0)

        --Preparing vars and making sure we do have indentifiers
        local url = "http://"..TX_LUACOMHOST.."/player/checkJoin"
        local exData = {
            txAdminToken = TX_LUACOMTOKEN,
            playerIds = GetPlayerIdentifiers(player),
            playerHwids = GetPlayerTokens(player),
            playerName = name
        }
        if #exData.playerIds <= 1 then
            d.done("\n[txAdmin] This server has bans or whitelisting enabled, which requires every player to have at least one identifier, which you have none.\nIf you own this server, make sure sv_lan is disabled in your server.cfg.")
            return
        end

        --Attempt to validate the user
        d.update("\n[txAdmin] Checking banlist/whitelist... (0/5)")
        CreateThread(function()
            local attempts = 0
            local isDone = false;
            --Do 5 attempts (2.5 mins)
            while isDone == false and attempts < 5 do
                attempts = attempts + 1
                d.update("\n[txAdmin] Checking banlist/whitelist... ("..attempts.."/5)")
                PerformHttpRequest(url, function(httpCode, rawData, resultHeaders)
                    if isDone then return end
                    -- rawData = nil
                    -- httpCode = 408

                    if not rawData or httpCode ~= 200 then
                        logError("Checking banlist/whitelist failed with code "..httpCode.." and message: "..tostring(rawData))
                    else
                        local respStr = tostring(rawData)
                        local respObj = json.decode(respStr)
                        if not respObj or type(respObj.allow) ~= "boolean" then
                            logError("Checking banlist/whitelist failed with invalid response: "..respStr)
                        else
                            if respObj.allow == true then
                                d.done()
                                isDone = true
                            else
                                local reason = respObj.reason or "\n[txAdmin] no reason provided"
                                d.done("\n"..reason)
                                isDone = true
                            end
                        end
                    end
                end, 'POST', json.encode(exData), {['Content-Type']='application/json'})
                Wait(30000) --30s
            end

            --Block client if failed
            if not isDone then
                d.done("\n[txAdmin] Failed to validate your banlist/whitelist status. Try again in a few minutes.")
                isDone = true
            end
        end)

    end
end


-- =============================================
-- Setup threads and commands & main stuff
-- =============================================

-- All commands & handlers
RegisterCommand("txaPing", txaPing, true)
RegisterCommand("txaKickAll", txaKickAll, true)
RegisterCommand("txaEvent", txaEvent, true)
RegisterCommand("txaReportResources", txaReportResources, true)
RegisterCommand("txaSetDebugMode", txaSetDebugMode, true)
AddEventHandler('playerConnecting', handleConnections)
SetHttpHandler(handleHttp)

-- HeartBeat functions are separated in case one hangs
CreateThread(function()
    while true do
        HTTPHeartBeat()
        Wait(3000)
    end
end)
CreateThread(function()
    while true do
        FD3HeartBeat()
        Wait(3000)
    end
end)

txPrint("Resource v"..TX_VERSION.." threads and commands set up. All Ready.")
