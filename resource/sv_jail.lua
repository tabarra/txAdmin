-- Prevent running in monitor mode
if not TX_SERVER_MODE then return end

-- =============================================
--  This file handles the jail (timeout) punishment enforcement:
--  isolating the player in a routing bucket, counting down the
--  sentence, and releasing on completion or revocation.
-- =============================================

local cvHideAdminInPunishments = GetConvarBool('txAdmin-hideAdminInPunishments')
local txServerName = GetConvar("txAdmin-serverName", "txAdmin")

--- Runtime state of currently jailed players, keyed by netid string
--- { actionId, remaining, reason, author, returnKey }
local jailedPlayers = {}

local jailReturnBuckets = {}

local function getReturnKey(targetIds)
    if type(targetIds) ~= 'table' then return nil end
    for _, id in ipairs(targetIds) do
        if type(id) == 'string' and id:sub(1, 8) == 'license:' then
            return id
        end
    end
    return nil
end


--- Releases a player from jail, restoring their routing bucket
---@param netidStr string
---@param reason string 'completed' or 'revoked'
local function releasePlayer(netidStr, reason)
    local jailData = jailedPlayers[netidStr]
    if jailData == nil then return end
    jailedPlayers[netidStr] = nil
    local netid = tonumber(netidStr)

    local prevRoutBucket
    if jailData.returnKey ~= nil then
        prevRoutBucket = jailReturnBuckets[jailData.returnKey]
        jailReturnBuckets[jailData.returnKey] = nil
    end

    if DoesPlayerExist(netidStr) then
        SetPlayerRoutingBucket(netidStr, prevRoutBucket or 0)
        Player(netid).state:set('txAdminJailed', nil, true)
        TriggerClientEvent('txcl:jail:release', netid)
    end

    if reason == 'completed' then
        PrintStructuredTrace(json.encode({
            type = 'txAdminJailComplete',
            actionId = jailData.actionId,
            netId = netid,
        }))
    end

    -- Public event so other resources (phone, jobs, etc.) can react
    TriggerEvent('txAdmin:events:playerJailReleased', {
        actionId = jailData.actionId,
        netId = netid,
        reason = reason,
    })
    txPrint(('Released player #%s from jail [%s] (%s)'):format(netidStr, jailData.actionId, reason))
end


--- Handler for the playerJailed event
--- Moves the target player to the jail bucket, teleports and freezes them
TX_EVENT_HANDLERS.playerJailed = function(eventData, isNew)
    if eventData.targetNetId == nil then return end
    local netidStr = tostring(eventData.targetNetId)
    if not DoesPlayerExist(netidStr) then
        txPrint(('[playerJailed] ignoring jail for disconnected player (#%s) %s'):format(
            netidStr,
            tostring(eventData.targetName)
        ))
        return
    end

    local netid = eventData.targetNetId
    local pos = IS_REDM and eventData.posRedm or eventData.posFivem

    -- move to the jail routing bucket, saving the current one
    local returnKey = getReturnKey(eventData.targetIds)
    if returnKey ~= nil and jailReturnBuckets[returnKey] == nil then
        jailReturnBuckets[returnKey] = GetPlayerRoutingBucket(netidStr)
    end
    SetPlayerRoutingBucket(netidStr, eventData.bucket)

    -- public statebag so other resources can detect the jailed status
    Player(netid).state:set('txAdminJailed', {
        actionId = eventData.actionId,
        remaining = eventData.remaining,
    }, true)

    jailedPlayers[netidStr] = {
        actionId = eventData.actionId,
        remaining = eventData.remaining,
        reason = eventData.reason,
        author = eventData.author,
        returnKey = returnKey,
    }

    local authorName = cvHideAdminInPunishments and txServerName or eventData.author or 'anonym'
    TriggerClientEvent(
        'txcl:jail:start',
        netid,
        authorName,
        eventData.reason,
        eventData.remaining,
        pos
    )
    txPrint(('Jailing player (#%s) %s for %ds: %s'):format(
        netidStr,
        tostring(eventData.targetName),
        eventData.remaining,
        eventData.reason
    ))
end


--- Handler for the actionRevoked event (registered as no-op in sv_main.lua)
--- Releases the matching jailed player, if online
TX_EVENT_HANDLERS.actionRevoked = function(eventData)
    if eventData.actionType ~= 'jail' then return end
    for netidStr, jailData in pairs(jailedPlayers) do
        if jailData.actionId == eventData.actionId then
            releasePlayer(netidStr, 'revoked')
            return
        end
    end
end


-- Countdown thread: ticks the remaining time and releases at zero.
-- Also refreshes the public statebag every ~15s.
CreateThread(function()
    local statebagSyncCounter = 0
    while true do
        Wait(1000)
        statebagSyncCounter = statebagSyncCounter + 1
        local doStatebagSync = statebagSyncCounter >= 15
        if doStatebagSync then statebagSyncCounter = 0 end

        for netidStr, jailData in pairs(jailedPlayers) do
            jailData.remaining = jailData.remaining - 1
            if jailData.remaining <= 0 then
                releasePlayer(netidStr, 'completed')
            elseif doStatebagSync and DoesPlayerExist(netidStr) then
                Player(tonumber(netidStr)).state:set('txAdminJailed', {
                    actionId = jailData.actionId,
                    remaining = jailData.remaining,
                }, true)
            end
        end
    end
end)


-- Clear the runtime entry when a jailed player leaves.
-- The served time is persisted by the txAdmin core on disconnect.
AddEventHandler('playerDropped', function()
    local srcStr = tostring(source)
    if jailedPlayers[srcStr] ~= nil then
        txPrint(('Player #%s left while jailed [%s]'):format(srcStr, jailedPlayers[srcStr].actionId))
        jailedPlayers[srcStr] = nil
    end
end)
