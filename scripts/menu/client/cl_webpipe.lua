if (GetConvar('txEnableMenuBeta', 'false') ~= 'true') then
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
    
    if ret.path == '/auth/nui' then
        local resp = json.decode(body)
        if not resp then
            print("^1[AUTH] invalid JSON: " .. (body or "nil"))
            menuIsAccessible = false
        else
            if statusCode == 200 and resp.isAdmin then
                print("^2[AUTH] accepted with permissions: " .. json.encode(resp.permissions or "nil"))
                menuIsAccessible = true
                menuPermissions = resp.permissions
            else
                print("^1[AUTH] rejected with reason: " .. json.encode(resp.reason or "nil"))
                menuIsAccessible = false
            end
        end

        -- Also update debug status on first HTTP cb
        sendMenuMessage('setDebugMode', isMenuDebug)
        registerTxKeybinds()
        ret.cb(resp)
    end
    
    local sub = string.sub
    if sub(ret.path, 1, 5) == '/css/' or
      sub(ret.path, 1, 4) == '/js/' or
      sub(ret.path, 1, 5) == '/img/' or
      sub(ret.path, 1, 7) == '/fonts/' then
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
