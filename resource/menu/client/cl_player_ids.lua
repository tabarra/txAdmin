-- =============================================
--  This file contains all overhead player ID logic
-- =============================================
if (GetConvar('txAdmin-menuEnabled', 'false') ~= 'true') then
    return
end

local isPlayerIDActive = false
local playerGamerTags = {}

-- Convar used to determine the distance in which player ID's are visible
local distanceToCheck = GetConvarInt('txAdmin-menuPlayerIdDistance', 150)

local gamerTagCompsEnum = {
    GamerName = 0,
    CrewTag = 1,
    HealthArmour = 2,
    BigText = 3,
    AudioIcon = 4,
    UsingMenu = 5,
    PassiveMode = 6,
    WantedStars = 7,
    Driver = 8,
    CoDriver = 9,
    Tagged = 12,
    GamerNameNearby = 13,
    Arrow = 14,
    Packages = 15,
    InvIfPedIsFollowing = 16,
    RankText = 17,
    Typing = 18
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
    -- Per infinity this will only return players within 300m
    local allActivePlayers = GetActivePlayers()

    for _, i in ipairs(allActivePlayers) do
        local targetPed = GetPlayerPed(i)
        local playerStr = '[' .. GetPlayerServerId(i) .. ']' .. ' ' .. GetPlayerName(i)

        -- If we have not yet indexed this player or their tag has somehow dissapeared (pause, etc)
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
            -- Setup name
            SetMpGamerTagVisibility(targetTag, gamerTagCompsEnum.GamerName, 1)

            -- Setup AudioIcon
            SetMpGamerTagAlpha(targetTag, gamerTagCompsEnum.AudioIcon, 255)
            -- Set audio to red when player is talking
            SetMpGamerTagVisibility(targetTag, gamerTagCompsEnum.AudioIcon, NetworkIsPlayerTalking(i))
            -- Setup Health
            SetMpGamerTagHealthBarColor(targetTag, 129)
            SetMpGamerTagAlpha(targetTag, gamerTagCompsEnum.HealthArmour, 255)
            SetMpGamerTagVisibility(targetTag, gamerTagCompsEnum.HealthArmour, 1)
        else
            -- Cleanup name
            SetMpGamerTagVisibility(targetTag, gamerTagCompsEnum.GamerName, 0)
            -- Cleanup Health
            SetMpGamerTagVisibility(targetTag, gamerTagCompsEnum.HealthArmour, 0)
            -- Cleanup AudioIcon
            SetMpGamerTagVisibility(targetTag, gamerTagCompsEnum.AudioIcon, 0)
        end
    end
end

local function showPlayerIDs(enabled)
    if not menuIsAccessible then return end

    isPlayerIDActive = enabled
    if not isPlayerIDActive then
        sendSnackbarMessage('info', 'nui_menu.page_main.player_ids.alert_hide', true)
        -- Remove all gamer tags and clear out active table
        cleanUpGamerTags()
    else
        sendSnackbarMessage('info', 'nui_menu.page_main.player_ids.alert_show', true)
    end

    debugPrint('Show Player IDs Status: ' .. tostring(isPlayerIDActive))
end

RegisterNetEvent('txAdmin:menu:showPlayerIDs', function(enabled)
    debugPrint('Received showPlayerIDs event')
    showPlayerIDs(enabled)
end)

local function togglePlayerIDsHandler()
    TriggerServerEvent('txAdmin:menu:showPlayerIDs', not isPlayerIDActive)
end

RegisterNUICallback('togglePlayerIDs', function(_, cb)
    togglePlayerIDsHandler()
    cb({})
end)

RegisterCommand('txAdmin:menu:togglePlayerIDs', togglePlayerIDsHandler)

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
