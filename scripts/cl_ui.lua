local isRDR = not TerraingridActivate and true or false
local dismissKey
local dismissKeyGroup
if isRDR then 
    dismissKey = 0xD9D0E1C0
    dismissKeyGroup = 1
else
    dismissKey = 22
    dismissKeyGroup = 0
end

function openWarning(author, reason, tTitle, tWarnedBy, tInstructions)
    SendNUIMessage({
        type = 'open_warning',
        author = author,
        reason = reason,
        tTitle = tTitle,
        tWarnedBy = tWarnedBy,
        tInstructions = tInstructions
    })

    Citizen.CreateThread(function()
        local countLimit = 100 --10 seconds
        local count = 0
        while true do
            Citizen.Wait(100)
            if IsControlPressed(dismissKeyGroup, dismissKey) then
                count = count +1
                if count >= countLimit then
                    SendNUIMessage({type = 'close_warning'})
                    return
                elseif math.fmod(count, 10) == 0 then
                    SendNUIMessage({type = 'pulse_warning'})
                end
            else
                count = 0
            end
        end
    end)
end

RegisterNetEvent("txAdminClient:warn")
AddEventHandler("txAdminClient:warn", openWarning)
