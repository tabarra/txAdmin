-- Prevent running if menu is disabled
if not TX_MENU_ENABLED then return end

-- =============================================
--  This file contains all Client WebPipe logic.
--  It is used to pass NUI HTTP reqs to txAdmin
-- =============================================

-- Vars
local pipeReturnCallbacks = {}
local pipeCallbackCounter = 1
local menuCloseGracePeriod = 750

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

    --Check if the menu is accessible and visible, otherwise it might be a CSRF attempt
    --Does not trigger within a 750ms grace period after the menu is closed
    if
        (not menuIsAccessible or not isMenuVisible)
        and (GetGameTimer() - tsLastMenuClose) > menuCloseGracePeriod
    then
        txPrint('^1NUI WebPipe request received the request below while the menu is not accessible or visible:')
        txPrint(('^3%s %s'):format(method, string.sub(path, 1, 100)))
        return cb({
            status = 403,
            body = '{}',
        })
    end
    debugPrint(("^3WebPipe[^1%d^3]^0 ^2%s ^4%s^0"):format(pipeCallbackCounter, method, path))

    -- Check for CSRF attempt
    if not IsNuiRequestOriginValid(headers) then
        debugPrint(("^3WebPipe[^1%d^3]^0 ^1invalid origin^0"):format(pipeCallbackCounter))
        return cb({
            status = 403,
            body = '{}',
        })
    end

    -- Check if the request is cached
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

    local id = pipeCallbackCounter
    pipeReturnCallbacks[id] = { cb = cb, path = path }
    pipeCallbackCounter = pipeCallbackCounter + 1
    if pipeCallbackCounter > 2048 then
        pipeCallbackCounter = 1
    end

    TriggerServerEvent('txsv:webpipe:req', id, method, path, headers, body or '')
end)


-- receive the http responses from server
RegisterNetEvent('txcl:webpipe:resp', function(callbackId, statusCode, body, headers)
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
