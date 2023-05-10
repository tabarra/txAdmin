-- =============================================
--  ServerCtx Synchronization
-- =============================================
ServerCtx = false

--- Updates ServerCtx based on GlobalState and will send it to NUI
--- NOTE: for now the ServerCtx is only being set when the menu tries to load (enabled or not)
function updateServerCtx()
    stateBagServerCtx = GlobalState.txAdminServerCtx
    if stateBagServerCtx == nil then
        debugPrint('^3ServerCtx fallback support activated.')
        TriggerServerEvent('txsv:req:serverCtx')
    else
        ServerCtx = stateBagServerCtx
        debugPrint('^2ServerCtx updated from global state')
    end
end

RegisterNetEvent('txcl:setServerCtx', function(ctx)
    if type(ctx) ~= 'table' then return end
    ServerCtx = ctx
    debugPrint('^2ServerCtx updated from server event.')
    sendMenuMessage('setServerCtx', ServerCtx)
end)



-- =============================================
--  Announcement, DirectMessage and Warn handling
-- =============================================
-- Dispatch Announcements
RegisterNetEvent('txcl:showAnnouncement', function(message, author)
    sendMenuMessage(
        'addAnnounceMessage',
        {
            message = message,
            author = author
        }
    )
end)
RegisterNetEvent('txcl:showDirectMessage', function(message, author)
    sendMenuMessage(
        'addDirectMessage',
        {
            message = message,
            author = author
        }
    )
end)

-- TODO: remove [SPACE] holding requirement?
local dismissKey, dismissKeyGroup
if IS_FIVEM then
    dismissKey = 22
    dismissKeyGroup = 0
else
    dismissKey = 0xD9D0E1C0
    dismissKeyGroup = 1
end

RegisterNetEvent('txcl:showWarning', function(author, reason)
    toggleMenuVisibility(false)
    sendMenuMessage('setWarnOpen', {
        reason = reason,
        warnedBy = author
    })
    CreateThread(function()
        local countLimit = 100 --10 seconds
        local count = 0
        while true do
            Wait(100)
            if IsControlPressed(dismissKeyGroup, dismissKey) then
                count = count +1
                if count >= countLimit then
                    sendMenuMessage('closeWarning')
                    return
                elseif math.fmod(count, 10) == 0 then
                    sendMenuMessage('pulseWarning')
                end
            else
                count = 0
            end
        end
    end)
end)


-- =============================================
--  Other stuff
-- =============================================
-- Removing unwanted chat suggestions
-- We only want suggestion for: /tx, /txAdmin-reauth
-- The suggestion is added after 500ms, so we need to wait more
CreateThread(function()
    Wait(1000)
    --Commands
    TriggerEvent('chat:removeSuggestion', '/txadmin') --too spammy
    TriggerEvent('chat:removeSuggestion', '/txaPing')
    TriggerEvent('chat:removeSuggestion', '/txaKickAll')
    TriggerEvent('chat:removeSuggestion', '/txaEvent')
    TriggerEvent('chat:removeSuggestion', '/txaReportResources')
    TriggerEvent('chat:removeSuggestion', '/txaSetDebugMode')

    --Keybinds
    TriggerEvent('chat:removeSuggestion', '/txAdmin:menu:noClipToggle')
    TriggerEvent('chat:removeSuggestion', '/txAdmin:menu:openPlayersPage')
    TriggerEvent('chat:removeSuggestion', '/txAdmin:menu:togglePlayerIDs')

    --Convars
    TriggerEvent('chat:removeSuggestion', '/txAdmin-version')
    TriggerEvent('chat:removeSuggestion', '/txAdmin-locale')
    TriggerEvent('chat:removeSuggestion', '/txAdmin-localeFile')
    TriggerEvent('chat:removeSuggestion', '/txAdmin-verbose')
    TriggerEvent('chat:removeSuggestion', '/txAdmin-luaComHost')
    TriggerEvent('chat:removeSuggestion', '/txAdmin-luaComToken')
    TriggerEvent('chat:removeSuggestion', '/txAdmin-checkPlayerJoin')
    TriggerEvent('chat:removeSuggestion', '/txAdmin-pipeToken')
    TriggerEvent('chat:removeSuggestion', '/txAdmin-debugMode')
    TriggerEvent('chat:removeSuggestion', '/txAdmin-hideDefaultAnnouncement')
    TriggerEvent('chat:removeSuggestion', '/txAdmin-hideDefaultDirectMessage')
    TriggerEvent('chat:removeSuggestion', '/txAdmin-hideDefaultWarning')
    TriggerEvent('chat:removeSuggestion', '/txAdmin-hideDefaultScheduledRestartWarning')
    TriggerEvent('chat:removeSuggestion', '/txAdminServerMode')

    --Menu convars
    TriggerEvent('chat:removeSuggestion', '/txAdmin-menuEnabled')
    TriggerEvent('chat:removeSuggestion', '/txAdmin-menuAlignRight')
    TriggerEvent('chat:removeSuggestion', '/txAdmin-menuPageKey')
    TriggerEvent('chat:removeSuggestion', '/txAdmin-playerIdDistance')
    TriggerEvent('chat:removeSuggestion', '/txAdmin-menuDrunkDuration')
end)

