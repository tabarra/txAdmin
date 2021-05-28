-- Vars
local pipeReturnCallbacks = {}
local pipeCallbackCounter = 1
-- FIXME: add callback timeouts on 9000ms
-- FIXME: control the pipeReturnCallbacks to prevent memory leak
-- FIXME: check what happens if the pipeCallbackCounter gets too big 

-- catching all NUI requests for https://monitor/WebPipe/
RegisterRawNuiCallback('WebPipe', function(req, cb)
    local path = req.path
    local headers = req.headers
    local body = req.body
    local method = req.method
    debugPrint("^3WebPipe[^1" .. pipeCallbackCounter .. "^3]^0 " .. method .. " " .. path)
    debugPrint("^3WebPipe[^1" .. pipeCallbackCounter .. "^3]^0 " .. json.encode(headers))

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
    debugPrint("^3WebPipe[^1" .. callbackId .. "^3]^0 recv=" .. json.encode(ret))
    if not ret then return end
    
    if ret.path == '/auth/nui' and statusCode == 200 then
        local resp = json.decode(body)
        if not resp then
            print("^1Invalid NUI auth response received: " .. (body or "nil"))
        else
            menuIsAccessible = resp.isAdmin
            SendNUIMessage({
                action = 'setPermissionsState',
                data = {
                    isAdmin = resp.isAdmin,
                    permission = resp.permissions,
                    expiration = resp.expiration,
                }
            })
        end
    end
    
    ret.cb({
        status = statusCode,
        body = body,
        headers = headers
    })
    
    pipeReturnCallbacks[callbackId] = nil
    debugPrint("^3WebPipe[^1" .. callbackId .. "^3]^0 closed (" .. #pipeReturnCallbacks .. " open)")
end)
