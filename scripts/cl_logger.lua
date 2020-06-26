-- Death reasons
local deathHashTable = {
    ["animal"]    = { -100946242, 148160082 },
    ["bullet"]    = { 453432689, 1593441988, 584646201, -1716589765, 324215364, 736523883, -270015777, -1074790547, -2084633992, -1357824103, -1660422300, 2144741730, 487013001, 2017895192, -494615257, -1654528753, 100416529, 205991906, 1119849093 },
    ["burn"]      = { 615608432, 883325847, -544306709 },
    ["car"]       = { 133987706, -1553120962 },
    ["explosion"] = { -1568386805, 1305664598, -1312131151, 375527679, 324506233, 1752584910, -1813897027, 741814745, -37975472, 539292904, 341774354, -1090665087 },
    ["gas"]       = { -1600701090 },
    ["knife"]     = { -1716189206, 1223143800, -1955384325, -1833087301, 910830060 },
    ["melee"]     = { -1569615261, 1737195953, 1317494643, -1786099057, 1141786504, -2067956739, -868994466 },
    ["drown"]     = { -10959621, 1936677264 },
    ["unknown"]   = { -842959696 }, -- Fall Damage or SetEntityHealth()
}

-- Process player deaths
local function getDeathReason(causeHash)
    for reason, hashes in pairs(deathHashTable) do
        for _, hash in pairs(hashes) do
            if hash == causeHash then
                return reason
            end
        end
    end
    return "unknown"
end

local function processDeath(ped)
    local killerPed = GetPedSourceOfDeath(ped)
    local causeHash = GetPedCauseOfDeath(ped)
    local killer, deathReason

    if killerPed == ped then
        killer = false
        local cause = getDeathReason(causeHash)
        if cause ~= "unknown" then
            deathReason = "suicide (" .. cause .. ")"
        else
            deathReason = "suicide"
        end
    else
        if IsEntityAPed(killerPed) and IsPedAPlayer(killerPed) then
            killer = NetworkGetPlayerIndexFromPed(killerPed)
        elseif IsEntityAVehicle(killerPed) then
            local drivingPed = GetPedInVehicleSeat(killerPed, -1)
            if IsEntityAPed(drivingPed) == 1 and IsPedAPlayer(drivingPed) then
                killer = NetworkGetPlayerIndexFromPed(drivingPed)
            else
                killer = false
            end
        elseif not IsPedAPlayer(killerPed) then
            killer = killerPed
        end

        deathReason = getDeathReason(causeHash)
    end

    if killer == nil then
        killer = false
    end

    TriggerServerEvent("txaLogger:DeathNotice", killer, deathReason)
end

-- Trigger Event From External Script
-- NOTE: couldn't people just call the txaLogger:DeathNotice event???
RegisterNetEvent('txAdmin:beta:deathLog')
AddEventHandler('txAdmin:beta:deathLog', function(ped)
	processDeath(ped) -- Remember to add a wait function before reviving into an animation.
end)

--[[ Thread ]]--
local deathFlag = false
local IsEntityDead = IsEntityDead
CreateThread(function()
    while true do
        Wait(500)
        local ped = GetPlayerPed(-1)
        local isDead = IsEntityDead(ped)
        if isDead and not deathFlag then
            deathFlag = true
            processDeath(ped)
        elseif not isDead then
            deathFlag = false
        end
    end
end)
