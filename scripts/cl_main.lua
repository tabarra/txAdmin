-- ===============
--  ServerCtx
-- ===============
ServerCtx = false
local onesyncEnabled

-- NOTE: for now the ServerCtx is only being set when the menu tries to load (enabled or not)
--- Will update ServerCtx based on GlobalState and will send it to NUI
function updateServerCtx()
    _ServerCtx = GlobalState.txAdminServerCtx
    if _ServerCtx == nil then
        debugPrint('^3ServerCtx fallback support activated')
        TriggerServerEvent('txAdmin:events:getServerCtx')
    else
        ServerCtx = _ServerCtx
        ServerCtx.endpoint = GetCurrentServerEndpoint()
        onesyncEnabled = ServerCtx.oneSync.status
        debugPrint('^2ServerCtx updated from global state')
    end
end

RegisterNetEvent('txAdmin:events:setServerCtx', function(ctx)
    if type(ctx) ~= 'table' then return end
    ServerCtx = ctx
    ServerCtx.endpoint = GetCurrentServerEndpoint()
    onesyncEnabled = ServerCtx.oneSync.status
    debugPrint('^2ServerCtx updated from server event')
end)

RegisterNUICallback('getServerCtx', function(_, cb)
    CreateThread(function()
        updateServerCtx()
        while ServerCtx == false do Wait(0) end
        debugPrint('Server CTX:')
        debugPrint(json.encode(ServerCtx))
        cb(ServerCtx)
    end)
end)

-- Removing unwanted chat suggestions
-- We only want suggestion for: /tx, /txAdmin-debug, /txAdmin-reauth
-- The suggestion is added after 500ms, so we need to wait more
CreateThread(function()
    Wait(1000)
    TriggerEvent('chat:removeSuggestion', '/txadmin') --too spammy
    TriggerEvent('chat:removeSuggestion', '/txaPing')
    TriggerEvent('chat:removeSuggestion', '/txaWarnID')
    TriggerEvent('chat:removeSuggestion', '/txaKickAll')
    TriggerEvent('chat:removeSuggestion', '/txaKickID')
    TriggerEvent('chat:removeSuggestion', '/txaDropIdentifiers')
    TriggerEvent('chat:removeSuggestion', '/txaBroadcast')
    TriggerEvent('chat:removeSuggestion', '/txaEvent')
    TriggerEvent('chat:removeSuggestion', '/txaSendDM')
    TriggerEvent('chat:removeSuggestion', '/txaReportResources')
    TriggerEvent('chat:removeSuggestion', '/txAdmin:menu:noClipToggle')
    TriggerEvent('chat:removeSuggestion', '/txAdmin:menu:endSpectate')
    TriggerEvent('chat:removeSuggestion', '/txAdmin-version')
    TriggerEvent('chat:removeSuggestion', '/txAdmin-locale')
    TriggerEvent('chat:removeSuggestion', '/txAdmin-verbose')
    TriggerEvent('chat:removeSuggestion', '/txAdmin-apiHost')
    TriggerEvent('chat:removeSuggestion', '/txAdmin-apiToken')
    TriggerEvent('chat:removeSuggestion', '/txAdmin-checkPlayerJoin')
    TriggerEvent('chat:removeSuggestion', '/txAdmin-pipeToken')
    TriggerEvent('chat:removeSuggestion', '/txAdminServerMode')
    TriggerEvent('chat:removeSuggestion', '/txAdminMenu-debugMode')
    TriggerEvent('chat:removeSuggestion', '/txEnableMenuBeta')
end)


-- Disabled for the moment until player list can be investigated
-- fully

-- Self data reporting thread
--CreateThread(function()
--    local ceil = math.ceil
--
--    while true do
--        local ped = PlayerPedId()
--        local vehClass = 0
--        local veh = GetVehiclePedIsIn(ped)
--        if veh and veh > 0 then
--            vehClass = GetVehicleClass(veh)
--        end
--
--        if onesyncEnabled then
--            TriggerServerEvent('txAdmin:selfDataReport', vehClass)
--        else
--            local health = ceil(((GetEntityHealth(ped) - 100) / 100) * 100)
--            local coords = GetEntityCoords(ped) or -1
--            TriggerServerEvent('txAdmin:selfDataReport', vehClass, health, coords)
--        end
--
--        Wait(5000)
--    end
--end)
