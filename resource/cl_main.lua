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
                count = count + 1
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
    local suggestionsToRemove = {
        --Commands
        '/txadmin',
        '/txaPing',
        '/txaKickAll',
        '/txaEvent',
        '/txaReportResources',
        '/txaSetDebugMode',

        --Keybinds
        '/txAdmin:menu:noClipToggle',
        '/txAdmin:menu:openPlayersPage',
        '/txAdmin:menu:togglePlayerIDs',

        --Convars
        '/txAdmin-version',
        '/txAdmin-locale',
        '/txAdmin-localeFile',
        '/txAdmin-verbose',
        '/txAdmin-luaComHost',
        '/txAdmin-luaComToken',
        '/txAdmin-checkPlayerJoin',
        '/txAdmin-pipeToken',
        '/txAdmin-debugMode',
        '/txAdmin-hideDefaultAnnouncement',
        '/txAdmin-hideDefaultDirectMessage',
        '/txAdmin-hideDefaultWarning',
        '/txAdmin-hideDefaultScheduledRestartWarning',
        '/txAdminServerMode',

        --Menu convars
        '/txAdmin-menuEnabled',
        '/txAdmin-menuAlignRight',
        '/txAdmin-menuPageKey',
        '/txAdmin-menuPlayerIdDistance',
        '/txAdmin-menuDrunkDuration'
    }

    for _, suggestion in ipairs(suggestionsToRemove) do
        TriggerEvent('chat:removeSuggestion', suggestion)
    end
end)


-- =============================================
--  Helper to protect the NUI callbacks from CSRF attacks
--  NOTE: This is a temporary fix for the NUI callback Origin issue
-- =============================================
--- Check if a NUI callback is from the correct Origin
--- technically no request should come from nui://monitor, since the manifest version is cerulean
---@param headers table
---@return boolean
function IsNuiRequestOriginValid(headers)
    if type(headers) ~= 'table' then
        return false --no clue
    end
    if headers['Origin'] == nil then
        return true --probably legacy page
    end
    if type(headers['Origin']) ~= 'string' or headers['Origin'] == '' then
        return false --no clue
    end

    if headers['Origin'] == 'https://cfx-nui-monitor' then
        return true --probably self
    end
    if headers['Origin'] == 'https://monitor' then
        return true --probably legacy iframe inside web iframe
    end

    -- warn admin of possible csrf attempt
    if menuIsAccessible and sendPersistentAlert then
        local msg = ('ATTENTION! txAdmin received a NUI message from the origin "%s" which is not approved. This likely means that that resource is vulnerable to XSS which has been exploited to inject txAdmin commands. It is recommended that you fix the vulnerability or remove that resource completely. For more information: discord.gg/txAdmin.')            :format(headers['Origin'])
        sendPersistentAlert('csrfWarning', 'error', msg, false)
    end

    return false
end

--- Wrapper for RegisterRawNuiCallback which mimics the behavior of RegisterNUICallback
--- but checks the origin of the request to prevent CSRF attacks
function RegisterSecureNuiCallback(callbackName, funcCallback)
    RegisterRawNuiCallback(callbackName, function(req, nuiCallback)
        if not IsNuiRequestOriginValid(req.headers) then
            debugPrint(("^1Invalid NUI callback origin for %s"):format(callbackName))
            return nuiCallback({
                status = 403,
                body = '{}',
            })
        end

        -- calls the function
        funcCallback(json.decode(req.body), function(data)
            nuiCallback({
                status = 200,
                body = type(data) == 'table' and json.encode(data) or '{}',
            })
        end)
    end)
end
