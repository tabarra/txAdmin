--Check Environment
if GetConvar('txAdminServerMode', 'false') ~= 'true' then
    return
end

--Helpers
function log(x)
    print("^5[txAdminClient]^0 " .. x)
end
function logError(x)
    print("^5[txAdminClient]^1 " .. x .. "^0")
end
function unDeQuote(x)
    local new, count = string.gsub(x, utf8.char(65282), '"')
    return new
end

if GetCurrentResourceName() ~= "monitor" then
    logError('This resource should not be installed separately, it already comes with fxserver.')
    return
end


-- Global Vars
TX_ADMINS = {}
TX_PLAYERLIST = {}
TX_LUACOMHOST = GetConvar("txAdmin-luaComHost", "invalid")
TX_LUACOMTOKEN = GetConvar("txAdmin-luaComToken", "invalid")
TX_VERSION = GetResourceMetadata(GetCurrentResourceName(), 'version') -- for now, only used in the start print
TX_DEBUGMODE = (GetConvar('txAdmin-debugMode', 'false') == 'true') -- TODO: start using this global
TX_HIDE_ANNOUNCEMENT = (GetConvar('txAdmin-hideDefaultAnnouncement', 'false') == 'true')
TX_HIDE_DIRECTMESSAGE = (GetConvar('txAdmin-hideDefaultDirectMessage', 'false') == 'true')
TX_HIDE_WARNING = (GetConvar('txAdmin-hideDefaultWarning', 'false') == 'true')
TX_HIDE_SCHEDULEDRESTARTWARNING = (GetConvar('txAdmin-hideDefaultScheduledRestartWarning', 'false') == 'true')

-- Checking convars
if TX_LUACOMHOST == "invalid" or TX_LUACOMTOKEN == "invalid" then
    log('^1API Host or Pipe Token ConVars not found. Do not start this resource if not using txAdmin.')
    return
end
if TX_LUACOMTOKEN == "removed" then
    log('^1Please do not restart the monitor resource.')
    return
end

-- Erasing the token convar for security reasons, and then restoring it if debug mode.
-- The convar needs to be reset on first tick to prevent other resources from reading it.
-- We actually need to wait two frames: one for convar replication, one for debugPrint.
SetConvar("txAdmin-luaComToken", "removed")
CreateThread(function()
    Wait(0)
    if debugModeEnabled then
        debugPrint("Restoring txAdmin-luaComToken for next monitor restart")
        SetConvar("txAdmin-luaComToken", TX_LUACOMTOKEN)
    end
end)


-- =============================================
-- Setup threads and commands & main stuff
-- =============================================
local rejectAllConnections = false
local hbReturnData = 'no-data'
log("Version "..TX_VERSION.." starting...")
CreateThread(function()
    RegisterCommand("txaPing", txaPing, true)
    RegisterCommand("txaKickAll", txaKickAll, true)
    RegisterCommand("txaEvent", txaEvent, true)
    RegisterCommand("txaReportResources", txaReportResources, true)
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
    AddEventHandler('playerConnecting', handleConnections)
    SetHttpHandler(handleHttp)
    log("Threads and commands set up. All Ready.")
end)


-- HeartBeat functions
function HTTPHeartBeat()
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

function FD3HeartBeat()
    local payload = json.encode({type = 'txAdminHeartBeat'})
    PrintStructuredTrace(payload)
end

-- HTTP request handler
function handleHttp(req, res)
    res.writeHead(200, {["Content-Type"]="application/json"})

    if req.path == '/stats.json' then
        return res.send(hbReturnData)
    else
        return res.send(json.encode({error = 'route not found'}))
    end
end


-- =============================================
-- stdin commands
-- =============================================
function txaPing(source, args)
    log("Pong! (txAdmin resource is running)")
    CancelEvent()
end

-- Kick all players
function txaKickAll(source, args)
    if args[1] == nil then
        args[1] = 'no reason provided'
    else
        args[1] = unDeQuote(args[1])
    end
    log("Kicking all players with reason: "..args[1])
    for _, pid in pairs(GetPlayers()) do
        DropPlayer(pid, "\n".."Kicked for: " .. args[1])
    end
    CancelEvent()
end


-- =============================================
--  Events handling
-- =============================================
-- Broadcast admin message to all players
local function handleAnnouncementEvent(eventData)
    if not TX_HIDE_ANNOUNCEMENT then
        TriggerClientEvent("txAdmin:receiveAnnounce", -1, eventData.message, eventData.author)
    end
    TriggerEvent('txaLogger:internalChatMessage', 'tx', "(Broadcast) "..eventData.author, eventData.message)
end

-- Broadcast through an announcement that the server will restart in XX minutes
local function handleScheduledRestartEvent(eventData)
    if not TX_HIDE_SCHEDULEDRESTARTWARNING then
        TriggerClientEvent("txAdmin:receiveAnnounce", -1, eventData.translatedMessage, 'txAdmin')
    end
    TriggerEvent('txaLogger:internalChatMessage', 'tx', "(Broadcast) txAdmin", eventData.translatedMessage)
end

-- Sends a direct message from an admin to a player
local function handleDirectMessageEvent(eventData)
    if not TX_HIDE_DIRECTMESSAGE then
        TriggerClientEvent("txAdmin:receiveDirectMessage", eventData.target, eventData.message, eventData.author)
    end
    TriggerEvent('txaLogger:internalChatMessage', 'tx', "(DM) "..eventData.author, eventData.message)
end

-- Kicks a player
local function handleKickEvent(eventData)
    Wait(0) -- give other resources a chance to read player data
    DropPlayer(eventData.target, '[txAdmin] ' .. eventData.reason)
end

-- Warn specific player via server ID
local function handleWarnEvent(eventData)
    local pName = GetPlayerName(eventData.target)
    if pName ~= nil then
        if not TX_HIDE_WARNING then
            TriggerClientEvent("txAdminClient:warn", eventData.target, eventData.author, eventData.reason)
        end
        log("Warning "..pName.." with reason: "..eventData.reason)
    else
        logError('handleWarnEvent: player not found')
    end
end

-- Ban player(s) via netid or identifiers
local function handleBanEvent(eventData)
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
                        log("handleBanEvent: Kicking #"..playerID..": "..eventData.reason)
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
        log("handleBanEvent: No players found to kick")
    end
end

-- Kicks all players and lock joins in preparation for server shutdown
local function handleShutdownEvent(eventData)
    print('Server shutdown imminent. Kicking all players.')
    rejectAllConnections = true
    local players = GetPlayers()
    for _, serverID in pairs(players) do
        DropPlayer(serverID, '[txAdmin] ' .. eventData.message)
    end
end

-- Handler for all incoming tx cmd events 
function txaEvent(source, args)
    -- sanity check
    if type(args[1]) ~= 'string' or type(args[2]) ~= 'string' then
        return logError('Invalid arguments for txaEvent')
    end
    -- prevent execution from admins or resources
    if source ~= 0 or GetInvokingResource() ~= nil then return end

    -- processing event
    local eventName = unDeQuote(args[1])
    local eventData = json.decode(unDeQuote(args[2]))
    TriggerEvent("txAdmin:events:" .. eventName, eventData)

    if eventName == 'announcement' then 
        return handleAnnouncementEvent(eventData)
    elseif eventName == 'playerDirectMessage' then 
        return handleDirectMessageEvent(eventData)
    elseif eventName == 'playerKicked' then 
        return handleKickEvent(eventData)
    elseif eventName == 'playerWarned' then 
        return handleWarnEvent(eventData)
    elseif eventName == 'playerBanned' then 
        return handleBanEvent(eventData)
    elseif eventName == 'serverShuttingDown' then 
        return handleShutdownEvent(eventData)
    elseif eventName == 'scheduledRestart' then 
        return handleScheduledRestartEvent(eventData)
    end
    CancelEvent()
end


-- =============================================
-- Get all resources/statuses and report back to txAdmin
-- =============================================
function txaReportResources(source, args)
    --Prepare resources list
    local resources = {}
    local max = GetNumResources() - 1
    for i = 0, max do
        local resName = GetResourceByFindIndex(i)

        -- hacky patch
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
        table.insert(resources, currentRes)
    end

    --Send to txAdmin
    local url = "http://"..TX_LUACOMHOST.."/intercom/resources"
    local exData = {
        txAdminToken = TX_LUACOMTOKEN,
        resources = resources
    }
    log('Sending resources list to txAdmin.')
    PerformHttpRequest(url, function(httpCode, data, resultHeaders)
        local resp = tostring(data)
        if httpCode ~= 200 then
            logError("ReportResources failed with code "..httpCode.." and message: "..resp)
        end
    end, 'POST', json.encode(exData), {['Content-Type']='application/json'})
end


-- =============================================
-- Player connecting handler
-- =============================================
function handleConnections(name, setKickReason, d)
    -- if server is shutting down
    if rejectAllConnections then
        CancelEvent()
        setKickReason("[txAdmin] Server is shutting down, try again in a few seconds.")
        return
    end

    local player = source
    if GetConvar("txAdmin-checkPlayerJoin", "invalid") == "true" then
        d.defer()
        Wait(0)

        --Preparing vars and making sure we do have indentifiers
        local url = "http://"..TX_LUACOMHOST.."/player/checkJoin"
        local exData = {
            txAdminToken = TX_LUACOMTOKEN,
            playerIds = GetPlayerIdentifiers(player),
            playerName = name
        }
        if #exData.playerIds <= 1 then
            d.done("\n[txAdmin] This server has bans or whitelisting enabled, which requires every player to have at least one identifier, which you have none.\nIf you own this server, make sure sv_lan is disabled in your server.cfg.")
            return
        end

        --Attempt to validate the user
        d.update("\n[txAdmin] Checking banlist/whitelist... (0/10)")
        CreateThread(function()
            local attempts = 0
            local isDone = false;
            --Do 10 attempts
            while isDone == false and attempts < 10 do
                attempts = attempts + 1
                d.update("\n[txAdmin] Checking banlist/whitelist... ("..attempts.."/10)")
                PerformHttpRequest(url, function(httpCode, rawData, resultHeaders)
                    -- Validating response
                    local respStr = tostring(rawData)
                    if httpCode ~= 200 then
                        logError("\n[txAdmin] Checking banlist/whitelist failed with code "..httpCode.." and message: "..respStr)
                    end
                    local respObj = json.decode(respStr)
                    if not respObj or type(respObj.allow) ~= "boolean" then
                        logError("\n[txAdmin] Checking banlist/whitelist failed with invalid response: "..respStr)
                    end
                    
                    if respObj.allow == true then
                        if not isDone then
                            d.done()
                            isDone = true
                        end
                    else 
                        if not isDone then
                            local reason = respObj.reason or "\n[txAdmin] no reason provided"
                            d.done("\n"..reason)
                            isDone = true
                        end
                    end
                end, 'POST', json.encode(exData), {['Content-Type']='application/json'})
                Wait(2000)
            end

            --Block client if failed
            if not isDone then
                d.done("\n[txAdmin] Failed to validate your banlist/whitelist status. Try again later.")
                isDone = true
            end
        end)

    end
end
