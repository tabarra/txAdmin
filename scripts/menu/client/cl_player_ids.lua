local isPlayerIDActive = false
local playerGamerTags = {}

local distanceToCheck = GetConvarInt('txAdminMenu-playerIdDistance', 150)

local gamerTagCompsEnum = {
    GamerName = 0,
    CrewTag = 1,
    HealthArmour = 2,
    BigText = 4,
    AudioIcon = 5,
    UsingMenu = 6,
    PassiveMode = 7,
    WantedStars = 8,
    Driver = 9,
    CoDriver = 10,
    Tagged = 11,
    GamerNameNearby = 12,
    Arrow = 13,
    Packages = 14,
    InvIfPedIsFollowing = 15,
    RankText = 16,
    Typing = 17
}

local function cleanUpGamerTags()
    debugPrint('Cleaning up gamer tags table')
    for _, v in pairs(playerGamerTags) do
        if IsMpGamerTagActive(v.gamerTag) then
            RemoveMpGamerTag(v.gamerTag)
        end
    end
    playerGamerTags = {}
end

local function showGamerTags()
    local curCoords = GetEntityCoords(PlayerPedId())
    local allActivePlayers = GetActivePlayers()

    for _, i in ipairs(allActivePlayers) do
        local targetPed = GetPlayerPed(i)
        local playerStr = '[' .. GetPlayerServerId(i) .. ']' .. ' ' .. GetPlayerName(i)

        if not playerGamerTags[i] or not IsMpGamerTagActive(playerGamerTags[i].gamerTag) then
            playerGamerTags[i] = {
                gamerTag = CreateFakeMpGamerTag(targetPed, playerStr, false, false, 0),
                ped = targetPed
            }
        end

        local targetTag = playerGamerTags[i].gamerTag

        local targetPedCoords = GetEntityCoords(targetPed)

        -- Distance Check
        if #(targetPedCoords - curCoords) <= distanceToCheck then
            -- Setup Health
            SetMpGamerTagHealthBarColor(targetTag, 129)
            SetMpGamerTagAlpha(targetTag, gamerTagCompsEnum.HealthArmour, 255)
            SetMpGamerTagVisibility(targetTag, gamerTagCompsEnum.HealthArmour, 1)
        else
            -- Cleanup Health
            SetMpGamerTagVisibility(targetTag, gamerTagCompsEnum.HealthArmour, 0)
        end
    end
end

RegisterNUICallback('togglePlayerIDs', function(_, cb)
    isPlayerIDActive = not isPlayerIDActive

    if not isPlayerIDActive then
        cleanUpGamerTags()
    end

    debugPrint('Show Player IDs Status: ' .. tostring(isPlayerIDActive))
    cb({})
end)

CreateThread(function()
    local sleep = 150
    while true do
        if isPlayerIDActive then
            showGamerTags()
            sleep = 50
        else
            sleep = 500
        end
        Wait(sleep)
    end
end)