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

-- Array of all the resource events
local resourceEvents = {
    'onResourceStarting',
    'onResourceStart',
    'onServerResourceStart',
    'onResourceListRefresh',
    'onResourceStop',
    'onServerResourceStop'
}

--[[
    onResourceStarting: An event that is triggered when a resource is trying to start.
    onResourceStart: An event that is triggered immediately when a resource has started.
    onServerResourceStart: An event that is queued after a resource has started.
    onResourceListRefresh: A server-side event triggered when the refresh command completes.
    onResourceStop: An event that is triggered immediately when a resource is stopping.
    onServerResourceStop: An event that is triggered after a resource has stopped.
--]]

local AddEventHandler = AddEventHandler

-- Add event handler for each event
for _, event in ipairs(resourceEvents) do
    AddEventHandler(event, function(resource)
        reportResourceEvent(event, resource)
    end)
end

-- TODO: As soon as the server start, send full list of resources to txAdmin
-- CreateThread(function()
--     blabla
-- end)
