-- =============================================
--  This file contains all logic around warn handling
-- =============================================

local isRDR = not TerraingridActivate and true or false
local dismissKey = isRDR and 0xD9D0E1C0 or 22
local dismissKeyGroup = isRDR and 1 or 0

local function openWarningHandler(author, reason)
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
end

RegisterNetEvent('txAdminClient:warn', openWarningHandler)