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
    -- print(method..": "..path)
    -- print(pipeCallbackCounter..": "..json.encode(headers))

    local id = pipeCallbackCounter
    pipeReturnCallbacks[id] = cb
    pipeCallbackCounter = pipeCallbackCounter + 1
    -- FIXME: if id > 2048 then id = 1 ????

    TriggerServerEvent('txAdmin:WebPipe', id, method, path, headers, body or '')
end)


-- receive the http responses from server
RegisterNetEvent('txAdmin:WebPipe')
AddEventHandler('txAdmin:WebPipe', function(callbackId, statusCode, body, headers)
    local ret = pipeReturnCallbacks[callbackId]

    if not ret then return end

    ret({
        status = statusCode,
        body = body,
        headers = headers
    })
    -- FIXME: do we need pipeReturnCallbacks[callbackId] = nil in here?
end)
