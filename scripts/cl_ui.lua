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
        local SpaceKey = 22
        if GetConvar("gamename", "rdr3") then 
            SpaceKey = 0xD9D0E1C0
        end
        while true do
            Citizen.Wait(100)
            print(SpaceKey)
            if IsControlPressed(1, SpaceKey) then
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
