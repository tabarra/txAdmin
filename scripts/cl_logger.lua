--- OPTIMIZATIONS
local CreateThread   = Citizen.CreateThread
local Wait           = Citizen.Wait
local PlayerPedId    = PlayerPedId
local IsEntityDead   = IsEntityDead

--- Death reasons
local deathHashTable = {
    ["animal"]    = { -100946242, 148160082 },
    ["bullet"]    = { 453432689, 1593441988, 584646201, -1716589765, 324215364, 736523883, -270015777, -1074790547, -2084633992, -1357824103, -1660422300, 2144741730, 487013001, 2017895192, -494615257, -1654528753, 100416529, 205991906, 1119849093 },
    ["burn"]      = { 615608432, 883325847, -544306709 },
    ["car"]       = { 133987706, -1553120962 },
    ["drown"]     = { -10959621, 1936677264 },
    ["explosion"] = { -1568386805, 1305664598, -1312131151, 375527679, 324506233, 1752584910, -1813897027, 741814745, -37975472, 539292904, 341774354, -1090665087 },
    ["gas"]       = { -1600701090 },
    ["knife"]     = { -1716189206, 1223143800, -1955384325, -1833087301, 910830060 },
    ["melee"]     = { -1569615261, 1737195953, 1317494643, -1786099057, 1141786504, -2067956739, -868994466 },
    ["unknown"]   = { -842959696 }, -- Fall Damage or SetEntityHealth()
}

---
--- FUNCTIONS
---

-- Process player deaths
local function processDeath(ped)
    local killerPed = GetPedSourceOfDeath(ped)
    local killer, deathReason

    if (killerPed == ped) then
        killer      = false
        deathReason = "suicide"
    else
        if IsEntityAPed(killerPed) and IsPedAPlayer(killerPed) then
            killer = NetworkGetPlayerIndexFromPed(killerPed)
        elseif IsEntityAVehicle(killerPed) then
            local drivingPed = GetPedInVehicleSeat(killerPed, -1)
            if IsEntityAPed(drivingPed) == 1 and IsPedAPlayer(drivingPed) == true then
                killer = NetworkGetPlayerIndexFromPed(drivingPed)
            else
                killer = false
            end
        end

        local causeHash = GetPedCauseOfDeath(ped)
        for reason, hashes in pairs(deathHashTable) do
            if deathReason ~= nil then break end
            for _, hash in pairs(hashes) do
                if hash == causeHash then
                    deathReason = reason
                    break
                end
            end
        end
    end

    TriggerServerEvent("txaLogger:DeathNotice", killer, deathReason)
end

---
--- THREAD
---

-- Detect deaths
local deathFlag = false
CreateThread(function()
    while true do
        Wait(750)
        local ped    = PlayerPedId()
        local isDead = IsEntityDead(ped)
        if isDead and not deathFlag then
            deathFlag = true
            processDeath(ped)
        elseif not isDead then
            deathFlag = false
        end
    end
end)
