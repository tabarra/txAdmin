-- Prevent running in monitor mode
if not TX_SERVER_MODE then return end


-- =============================================
--  Report all resource events to txAdmin
-- =============================================

local function reportResourceEvent(event, resource)
    -- print(string.format("\27[107m\27[30m %s: %s \27[0m", event, resource))
    PrintStructuredTrace(json.encode({
        type = 'txAdminResourceEvent',
        event = event,
        resource = resource
    }))
end


-- An event that is triggered when a resource is trying to start.
-- This can be canceled to prevent the resource from starting.
AddEventHandler('onResourceStarting', function(resource)
    reportResourceEvent('onResourceStarting', resource)
end)

-- An event that is triggered immediately when a resource has started.
AddEventHandler('onResourceStart', function(resource)
    reportResourceEvent('onResourceStart', resource)
end)

-- An event that is queued after a resource has started.
AddEventHandler('onServerResourceStart', function(resource)
    reportResourceEvent('onServerResourceStart', resource)
end)

-- A server-side event triggered when the refresh command completes.
AddEventHandler('onResourceListRefresh', function(resource)
    reportResourceEvent('onResourceListRefresh', resource)
end)

-- An event that is triggered immediately when a resource is stopping.
AddEventHandler('onResourceStop', function(resource)
    reportResourceEvent('onResourceStop', resource)
end)

-- An event that is triggered after a resource has stopped.
AddEventHandler('onServerResourceStop', function(resource)
    reportResourceEvent('onServerResourceStop', resource)
end)

-- TODO: As soon as the server start, send full list of resources to txAdmin
-- CreateThread(function()
--     blabla
-- end)
