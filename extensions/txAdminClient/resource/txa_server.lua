local apiPort = "invalid"
local apiToken = "invalid"
local serverCompatVersion = "invalid"
local txAdminClientVersion = "1.1.0"
print("[txAdminClient] Version "..txAdminClientVersion.." starting...")

Citizen.CreateThread(function()
    --Wait for environment variables
    local envAttempts = 0
    while apiPort == "invalid" or apiToken == "invalid" or serverCompatVersion == "invalid" do
        if envAttempts then
            Citizen.Wait(1000)
        end
        if envAttempts >= 5 then
            print("[txAdminClient] Waiting for environment setup...")
        end
        envAttempts = envAttempts + 1
        apiPort = GetConvar("txAdmin-apiPort", "invalid")
        apiToken = GetConvar("txAdmin-apiToken", "invalid")
        serverCompatVersion = GetConvar("txAdmin-clientCompatVersion", "invalid")
    end

    -- Detect version compatibility issues
    if serverCompatVersion ~= txAdminClientVersion then
        while true do
            print("[txAdminClient] This resource version is not compatible with the current txAdmin version. Please update or remove this resource to prevent any issues.")
            Citizen.Wait(5000)
        end
    end

    -- Setup threads and commands
    print("[txAdminClient] setting up threads and commands...")
    RegisterCommand("txaPing", txaPing, true)
    RegisterCommand("txaKickAll", txaKickAll, true)
    RegisterCommand("txaKickID", txaKickID, true)
    RegisterCommand("txaBroadcast", txaBroadcast, true)
    RegisterCommand("txaSendDM", txaSendDM, true)
    RegisterCommand("txaReportResources", txaReportResources, true)
    Citizen.CreateThread(function()
        while true do
            HeartBeat()
            Citizen.Wait(3000)
        end
    end)
end)


-- HeartBeat function
function HeartBeat()
    local url = "http://localhost:"..apiPort.."/intercom/monitor"
    local exData = {
        txAdminToken = apiToken,
        alive = true
    }
    PerformHttpRequest(url, function(httpCode, data, resultHeaders)
        local resp = tostring(data)
        if httpCode ~= 200 or resp ~= 'okay' then
            print("[txAdminClient] HeartBeat failed with code "..httpCode.." and message: "..resp)
        end
    end, 'POST', json.encode(exData), {['Content-Type']='application/json'})
end

-- Ping!
function txaPing(source, args)
    print("[txAdminClient] Pong!")
    CancelEvent()
end


-- Kick all players
function txaKickAll(source, args)
    if args[1] == nil then
        args[1] = 'no reason provided'
    end
    print("[txAdminClient] Kicking all players with reason: "..args[1])
    for _, pid in pairs(GetPlayers()) do
        DropPlayer(pid, "Kicked for: " .. args[1])
    end
    CancelEvent()
end


-- Kick specific player
function txaKickID(source, args)
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
end


-- Broadcast admin message to all players
function txaBroadcast(source, args)
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
end


-- Send admin direct message to specific player
function txaSendDM(source, args)
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
end


-- Get all resources/statuses and report back to txAdmin
function txaReportResources(source, args)
    --Prepare resources list
    local resources = {}
    local max = GetNumResources() - 1
    for i = 0, max do
        local resName = GetResourceByFindIndex(i)
        local currentRes = {
            name = resName,
            status = GetResourceState(resName),
            path = GetResourcePath(resName)
        }
        table.insert(resources, currentRes)
    end

    --Send to txAdmin
    local url = "http://localhost:"..apiPort.."/intercom/resources"
    local exData = {
        txAdminToken = apiToken,
        resources = resources
    }
    print('[txAdminClient] Sending resources list to txAdmin.')
    PerformHttpRequest(url, function(httpCode, data, resultHeaders)
        local resp = tostring(data)
        if httpCode ~= 200 or resp ~= 'okay' then
            print("[txAdminClient] ReportResources failed with code "..httpCode.." and message: "..resp)
        end
    end, 'POST', json.encode(exData), {['Content-Type']='application/json'})
end
