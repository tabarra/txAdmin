-- =============================================
--  This file contains all Client WebPipe logic.
--  It is used to pass NUI HTTP reqs to txAdmin
-- =============================================
if (GetConvar('txAdmin-menuEnabled', 'false') ~= 'true') then
    return
end
-- Vars
local pipeReturnCallbacks = {}
local pipeCallbackCounter = 1

---@class StaticCacheEntry
---@field body string
---@field headers string

---@class StaticCacheData : table<string, StaticCacheEntry>
local staticCacheData = {}

-- catching all NUI requests for https://monitor/WebPipe/
RegisterRawNuiCallback('WebPipe', function(req, cb)
    local path = req.path
    local headers = req.headers
    local body = req.body
    local method = req.method
    
    debugPrint(("^3WebPipe[^1%d^3]^0 ^2%s ^4%s^0"):format(pipeCallbackCounter, method, path))
    if staticCacheData[path] ~= nil then
        debugPrint(("^3WebPipe[^1%d^3]^0 ^2answered from cache!"):format(pipeCallbackCounter))
        local cacheEntry = staticCacheData[path]
        cb({
            status = 200,
            body = cacheEntry.body,
            headers = cacheEntry.headers,
        })
        return
    end

    -- Cookie wiper to prevent sticky cookie sessions after reauth
    if path == '/nui/resetSession' then
        if type(headers['Cookie']) ~= 'string' then
            return cb({
                status = 200,
                body = '{}',
            })
        else
            local cookies = {}
            for cookie in headers['Cookie']:gmatch('(tx:[^=]+)') do 
                cookies[#cookies +1] = cookie.."=deleted; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; httponly; SameSite=None; Secure"
            end
            return cb({
                status = 200,
                body = '{}',
                headers = {
                    ['Connection'] = "close",
                    ['Content-Type'] = "text/plain",
                    ['Set-Cookie'] = cookies
                }
            })
        end
    end

    local id = pipeCallbackCounter
    pipeReturnCallbacks[id] = { cb = cb, path = path }
    pipeCallbackCounter = pipeCallbackCounter + 1
    if pipeCallbackCounter > 2048 then
        pipeCallbackCounter = 1
    end

    TriggerServerEvent('txAdmin:WebPipe', id, method, path, headers, body or '')
end)


-- receive the http responses from server
RegisterNetEvent('txAdmin:WebPipe')
AddEventHandler('txAdmin:WebPipe', function(callbackId, statusCode, body, headers)
    local ret = pipeReturnCallbacks[callbackId]
    if not ret then return end
    
    local sub = string.sub
    if 
        sub(ret.path, 1, 5) == '/css/' or
        sub(ret.path, 1, 4) == '/js/' or
        sub(ret.path, 1, 5) == '/img/' or
        sub(ret.path, 1, 7) == '/fonts/'
    then
        staticCacheData[ret.path] = {
            body = body,
            headers = headers,
        }
    end
    
    ret.cb({
        status = statusCode,
        body = body,
        headers = headers
    })
    
    pipeReturnCallbacks[callbackId] = nil
    debugPrint("^3WebPipe[^1" .. callbackId .. "^3]^0 ^2finished^0 (" .. #pipeReturnCallbacks .. " open)")
end)
