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
ADMIN_DATA = {} --FIXME: use TX_ADMINS from sv_main.lua
local failedAuths = {}
local attemptCooldown = 15000


-- Handle auth failures
local function handleAuthFail(src, reason)
    local srcString = tostring(src)
    ADMIN_DATA[srcString] = nil
    failedAuths[srcString] = GetGameTimer()
    reason = reason or "unknown"
    debugPrint("Auth rejected #"..srcString.." ("..reason..")")
    TriggerClientEvent('txcl:setAdmin', src, false, reason)
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
        debugPrint("^2Authenticated admin #"..srcString.." with permissions: "..json.encode(resp.permissions))
        ADMIN_DATA[srcString] = {
            perms = resp.permissions,
            bucket = 0
        }
        sendInitialPlayerlist(src)
        TriggerClientEvent('txcl:setAdmin', src, resp.permissions)
    end, 'GET', '', headers)
end)


-- Handle player disconnection
--FIXME: validate
AddEventHandler('playerDropped', function()
    ADMIN_DATA[tostring(source)] = nil
end)


-- Handle updated admin list
--FIXME: migrate
--FIXME: pretty sure the same admin can get the event twice if in ADMIN_DATA and onlineAdminIDs
AddEventHandler('txAdmin:events:adminsUpdated', function(onlineAdminIDs)
    debugPrint('^3Admins changed. Online admins: ' .. json.encode(onlineAdminIDs) .. "^0")

    -- Collect old and new admin IDs
    local refreshAdminIds = {}
    for id, _ in pairs(ADMIN_DATA) do
        refreshAdminIds[#refreshAdminIds + 1] = id
    end
    for _, newId in pairs(onlineAdminIDs) do
        refreshAdminIds[#refreshAdminIds + 1] = newId
    end
    debugPrint('^3Forcing ' .. #refreshAdminIds .. ' clients to re-auth')

    -- Resetting all admin permissions and rate limiter
    ADMIN_DATA = {}
    failedAuths = {}

    -- Informing clients that they need to reauth
    for id, _ in pairs(refreshAdminIds) do
        TriggerClientEvent('txAdmin:menu:reAuth', id) 
    end
end)
