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


-- Self data reporting thread
CreateThread(function()
    local ceil = math.ceil
    
    while true do
        local ped = PlayerPedId()
        local vehClass = 0
        local veh = GetVehiclePedIsIn(ped)
        if veh and veh > 0 then
            vehClass = GetVehicleClass(veh)
        end

        if onesyncEnabled then
            TriggerServerEvent('txAdmin:selfDataReport', vehClass)
        else
            local health = ceil(((GetEntityHealth(ped) - 100) / 100) * 100)
            local coords = GetEntityCoords(ped) or -1
            TriggerServerEvent('txAdmin:selfDataReport', vehClass, health, coords)
        end

        Wait(5000)
    end
end)
