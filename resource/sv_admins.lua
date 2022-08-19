-- =============================================
--    Lua Admin Manager
-- =============================================
-- Checking Environment (sv_main MUST run first)
if GetConvar('txAdminServerMode', 'false') ~= 'true' then
    return
end
if TX_LUACOMHOST == "invalid" or TX_LUACOMTOKEN == "invalid" then
    log('^1API Host or Pipe Token ConVars not found. Do not start this resource if not using txAdmin.')
    return
end
if TX_LUACOMTOKEN == "removed" then
    log('^1Please do not restart the monitor resource.')
    return
end


-- Variables & Consts
local failedAuths = {}
local attemptCooldown = 15000


-- Handle auth failures
local function handleAuthFail(src, reason)
    local srcString = tostring(src)
    TX_ADMINS[srcString] = nil
    failedAuths[srcString] = GetGameTimer()
    reason = reason or "unknown"
    debugPrint("Auth rejected #"..srcString.." ("..reason..")")
    TriggerClientEvent('txcl:setAdmin', src, false, false, reason)
end

-- Handle menu auth requests
RegisterNetEvent('txsv:checkAdminStatus', function()
    local src = source
    local srcString = tostring(source)
    debugPrint('Handling authentication request from player #'..srcString)

    -- Rate Limiter
    if type(failedAuths[srcString]) == 'number' and failedAuths[srcString] + attemptCooldown > GetGameTimer() then
        return handleAuthFail(source, "too many auth attempts")
    end
    
    -- Prepping http request
    local url = "http://"..TX_LUACOMHOST.."/nui/auth"
    local headers = {
        ['Content-Type'] = 'application/json',
        ['X-TxAdmin-Token'] = TX_LUACOMTOKEN,
        ['X-TxAdmin-Identifiers'] = table.concat(GetPlayerIdentifiers(src), ', ')
    }

    -- Making http request
    PerformHttpRequest(url, function(httpCode, data, resultHeaders)
        -- Validating response
        local resp = json.decode(data)
        if not resp or type(resp.isAdmin) ~= "boolean" then
            return handleAuthFail(src, "invalid response")
        end
        if not resp.isAdmin then
            return handleAuthFail(src, resp.reason)
        end
        if type(resp.permissions) ~= 'table' then
            resp.permissions = {}
        end

        -- Setting up admin
        local adminTag = "[#"..src.."] "..resp.username
        debugPrint(("^2Authenticated admin ^5%s^2 with permissions: %s"):format(
            src,
            adminTag,
            json.encode(resp.permissions)
        ))
        TX_ADMINS[srcString] = {
            tag = adminTag,
            perms = resp.permissions,
            bucket = 0
        }
        sendInitialPlayerlist(src)
        TriggerClientEvent('txcl:setAdmin', src, resp.username, resp.permissions)
    end, 'GET', '', headers)
end)


-- Remove admin from table when disconnected
AddEventHandler('playerDropped', function()
    TX_ADMINS[tostring(source)] = nil
end)


-- Handle updated admin list
AddEventHandler('txAdmin:events:adminsUpdated', function(onlineAdminIDs)
    debugPrint('^3Admins list updated. Online admins: ' .. json.encode(onlineAdminIDs))

    -- Collect old and new admin IDs as key to prevent duplicate
    local refreshAdminIds = {}
    for id, _ in pairs(TX_ADMINS) do
        refreshAdminIds[id] = true
    end
    for _, id in pairs(onlineAdminIDs) do
        refreshAdminIds[tostring(id)] = true
    end
    debugPrint('^3Forcing clients to re-auth')

    -- Resetting all admin permissions and rate limiter
    TX_ADMINS = {}
    failedAuths = {}

    -- Informing clients that they need to reauth
    for id, _ in pairs(refreshAdminIds) do
        TriggerClientEvent('txAdmin:menu:reAuth', tonumber(id))
    end
end)
