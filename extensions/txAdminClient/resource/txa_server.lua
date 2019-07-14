local txAdminClientVersion = "1.1.0"
print("[txAdminClient] Version "..txAdminClientVersion.." starting...")

-- Detect version compatibility issues
Citizen.CreateThread(function()
    Citizen.Wait(1000)
    local serverCompatVersion = GetConvar("txAdmin-clientCompatVersion", "--")
    if serverCompatVersion ~= txAdminClientVersion then
        Citizen.CreateThread(function()
            while true do
                print("[txAdminClient] This resource version is not compatible with the current txAdmin version. Please update or remove this resource to prevent any issues.")
                Citizen.Wait(5000)
            end
        end)
    end

end)


-- FIXME: temp function
Citizen.CreateThread(function()
    local apiPort = GetConvar("txAdmin-apiPort", "invalid");
    local apiToken = GetConvar("txAdmin-apiToken", "invalid");
    local url = "http://localhost:"..apiPort.."/intercom/monitor"

    while true do
        local exData = {
            txAdminToken = apiToken,
            alive = true
        }
        PerformHttpRequest(url, function(httpCode, data, resultHeaders)
            local resp = tostring(data)
            if httpCode ~= 200 or resp ~= 'okay' then
                print("[txAdminClient] HeartBeat failed with message: "..resp)
            end
        end, 'POST', json.encode(exData), {['Content-Type']='application/json'})

        Citizen.Wait(3000)
    end
end)


-- Kick all players
RegisterCommand("txaKickAll", function(source, args)
    if args[1] == nil then
        args[1] = 'no reason provided'
    end
    print("[txAdminClient] Kicking all players with reason: "..args[1])
    for _, pid in pairs(GetPlayers()) do
        DropPlayer(pid, "Kicked for: " .. args[1])
    end
    CancelEvent()
end, true)


-- Kick specific player
RegisterCommand("txaKickID", function(source, args)
    if args[1] ~= nil then
        if args[2] == nil then
            args[2] = 'no reason provided'
        end
        print("[txAdminClient] Kicking #"..args[1].." with reason: "..args[2])
        DropPlayer(args[1], "Kicked for: " .. args[2])
    else
        print('[txAdminClient] invalid arguments for txaKickID')
    end
    CancelEvent()
end, true)


-- Broadcast admin message to all players
RegisterCommand("txaBroadcast", function(source, args)
    if args[1] ~= nil then
        print("[txAdminClient] Admin Broadcast: "..args[1])
        TriggerClientEvent("chat:addMessage", -1, {
            args = {
                "Admin Broadcast",
                args[1]
            },
            color = {255, 0, 0}
        })
    else
        print('[txAdminClient] invalid arguments for txaBroadcast')
    end
    CancelEvent()
end, true)


-- Send admin direct message to specific player
RegisterCommand("txaSendDM", function(source, args)
    if args[1] ~= nil and args[2] ~= nil then
        print("[txAdminClient] Admin DM to #"..args[1]..": "..args[2])
        TriggerClientEvent("chat:addMessage", args[1], {
            args = {
                "Admin Direct Message",
                args[2]
            },
            color = {255, 0, 0}
        })
    else
        print('[txAdminClient] invalid arguments for txaSendDM')
    end
    CancelEvent()
end, true)


-- Get all resources/statuses and report back to txAdmin
RegisterCommand("txaReportResources", function(source, args)
    print("===============================================")
    local max = GetNumResources() - 1
    -- max = 1
    for i = 0, max do
        local name = GetResourceByFindIndex(i)
        local state = GetResourceState(name)
        local path = GetResourcePath(name)
        print(state .. "\t" .. name .. "\t" .. path)
    end
end, true)
