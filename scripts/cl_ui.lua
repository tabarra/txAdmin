local isRDR = not TerraingridActivate and true or false
local dismissKey = isRDR and 0xD9D0E1C0 or 22
local dismissKeyGroup = isRDR and 1 or 0

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
