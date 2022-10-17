-- =============================================
--  ServerCtx Synchronization
-- =============================================
ServerCtx = false

-- NOTE: for now the ServerCtx is only being set when the menu tries to load (enabled or not)
--- Will update ServerCtx based on GlobalState and will send it to NUI
function updateServerCtx()
    _ServerCtx = GlobalState.txAdminServerCtx
    if _ServerCtx == nil then
        print('^3ServerCtx fallback support activated.')
        TriggerServerEvent('txAdmin:events:getServerCtx')
    else
        ServerCtx = _ServerCtx
        print('^2ServerCtx updated from global state')
    end
end

RegisterNetEvent('txAdmin:events:setServerCtx', function(ctx)
    if type(ctx) ~= 'table' then return end
    ServerCtx = ctx
    print('^2ServerCtx updated from server event.')
    sendMenuMessage('setServerCtx', ServerCtx)
end)



-- =============================================
--  Announcement, DirectMessage and Warn handling
-- =============================================
-- Dispatch Announcements
RegisterNetEvent('txAdmin:receiveAnnounce', function(message, author)
    sendMenuMessage(
        'addAnnounceMessage',
        {
            message = message,
            author = author
        }
    )
end)
RegisterNetEvent('txAdmin:receiveDirectMessage', function(message, author)
    sendMenuMessage(
        'addDirectMessage',
        {
            message = message,
            author = author
        }
    )
end)

-- TODO: remove [SPACE] holding requirement?
local isRDR = not TerraingridActivate and true or false
local dismissKey = isRDR and 0xD9D0E1C0 or 22
local dismissKeyGroup = isRDR and 1 or 0
RegisterNetEvent('txAdminClient:warn', function(author, reason)
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
-- We only want suggestion for: /tx, /txAdmin-debug, /txAdmin-reauth
-- The suggestion is added after 500ms, so we need to wait more
CreateThread(function()
    Wait(1000)
    --Commands
    TriggerEvent('chat:removeSuggestion', '/txadmin') --too spammy
    TriggerEvent('chat:removeSuggestion', '/txaPing')
    TriggerEvent('chat:removeSuggestion', '/txaKickAll')
    TriggerEvent('chat:removeSuggestion', '/txaEvent')
    TriggerEvent('chat:removeSuggestion', '/txaReportResources')

    --Keybinds
    TriggerEvent('chat:removeSuggestion', '/txAdmin:menu:noClipToggle')
    TriggerEvent('chat:removeSuggestion', '/txAdmin:menu:endSpectate')
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
    TriggerEvent('chat:removeSuggestion', '/txAdminServerMode')

    --Menu convars
    TriggerEvent('chat:removeSuggestion', '/txAdmin-menuEnabled')
    TriggerEvent('chat:removeSuggestion', '/txAdmin-menuAlignRight')
    TriggerEvent('chat:removeSuggestion', '/txAdmin-menuPageKey')
    TriggerEvent('chat:removeSuggestion', '/txAdmin-menuDebug')
    TriggerEvent('chat:removeSuggestion', '/txAdmin-playerIdDistance')
    TriggerEvent('chat:removeSuggestion', '/txAdmin-menuDrunkDuration')
end)

