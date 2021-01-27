-- Death reasons
local deathHashTable = {
    ["animal"] = { 
        GetHashKey('WEAPON_ANIMAL'),
        GetHashKey('WEAPON_COUGAR')
    },
    ["bullet"] = { 
        GetHashKey('WEAPON_ADVANCEDRIFLE'),
        GetHashKey('WEAPON_APPISTOL'),
        GetHashKey('WEAPON_ASSAULTRIFLE'),
        GetHashKey('WEAPON_ASSAULTRIFLE_MK2'),
        GetHashKey('WEAPON_ASSAULTSHOTGUN'),
        GetHashKey('WEAPON_ASSAULTSMG'),
        GetHashKey('WEAPON_ASSAULTSNIPER'),
        GetHashKey('WEAPON_AUTOSHOTGUN'),
        GetHashKey('WEAPON_BULLPUPRIFLE'),
        GetHashKey('WEAPON_BULLPUPRIFLE_MK2'),
        GetHashKey('WEAPON_BULLPUPSHOTGUN'),
        GetHashKey('WEAPON_CARBINERIFLE'),
        GetHashKey('WEAPON_CARBINERIFLE_MK2'),
        GetHashKey('WEAPON_COMBATMG'),
        GetHashKey('WEAPON_COMBATMG_MK2'),
        GetHashKey('WEAPON_COMBATPDW'),
        GetHashKey('WEAPON_COMBATPISTOL'),
        GetHashKey('WEAPON_COMPACTRIFLE'),
        GetHashKey('WEAPON_DBSHOTGUN'),
        GetHashKey('WEAPON_DOUBLEACTION'),
        GetHashKey('WEAPON_FLAREGUN'),
        GetHashKey('WEAPON_GUSENBERG'),
        GetHashKey('WEAPON_HEAVYPISTOL'),
        GetHashKey('WEAPON_HEAVYSHOTGUN'),
        GetHashKey('WEAPON_HEAVYSNIPER'),
        GetHashKey('WEAPON_HEAVYSNIPER_MK2'),
        GetHashKey('WEAPON_MACHINEPISTOL'),
        GetHashKey('WEAPON_MARKSMANPISTOL'),
        GetHashKey('WEAPON_MARKSMANRIFLE'),
        GetHashKey('WEAPON_MARKSMANRIFLE_MK2'),
        GetHashKey('WEAPON_MG'),
        GetHashKey('WEAPON_MICROSMG'),
        GetHashKey('WEAPON_MINIGUN'),
        GetHashKey('WEAPON_MINISMG'),
        GetHashKey('WEAPON_MUSKET'),
        GetHashKey('WEAPON_PISTOL'),
        GetHashKey('WEAPON_PISTOL50'),
        GetHashKey('WEAPON_PISTOL_MK2'),
        GetHashKey('WEAPON_PUMPSHOTGUN'),
        GetHashKey('WEAPON_PUMPSHOTGUN_MK2'),
        GetHashKey('WEAPON_RAILGUN'),
        GetHashKey('WEAPON_REVOLVER'),
        GetHashKey('WEAPON_REVOLVER_MK2'),
        GetHashKey('WEAPON_SAWNOFFSHOTGUN'),
        GetHashKey('WEAPON_SMG'),
        GetHashKey('WEAPON_SMG_MK2'),
        GetHashKey('WEAPON_SNIPERRIFLE'),
        GetHashKey('WEAPON_SNSPISTOL'),
        GetHashKey('WEAPON_SNSPISTOL_MK2'),
        GetHashKey('WEAPON_SPECIALCARBINE'),
        GetHashKey('WEAPON_SPECIALCARBINE_MK2'),
        GetHashKey('WEAPON_STINGER'),
        GetHashKey('WEAPON_STUNGUN'),
        GetHashKey('WEAPON_VINTAGEPISTOL')
    },
    ["burn"] = { 
        GetHashKey('AMMO_ENEMY_LASER'),
        GetHashKey('AMMO_PLAYER_LASER'),
        GetHashKey('VEHICLE_WEAPON_PLAYER_LASER'),
        GetHashKey('WEAPON_FIRE'),
        GetHashKey('WEAPON_FLARE'),
        GetHashKey('WEAPON_FLAREGUN'),
        GetHashKey('WEAPON_MOLOTOV'),
        GetHashKey('WEAPON_PETROLCAN')
    },
    ["car"] = { 
        GetHashKey('WEAPON_HELI_CRASH'),
        GetHashKey('WEAPON_RAMMED_BY_CAR'),
        GetHashKey('WEAPON_RUN_OVER_BY_CAR')
    },
    ["explosion"] = { 
        GetHashKey('AMMO_RPG'),
        GetHashKey('AMMO_SPACE_ROCKET'),
        GetHashKey('AMMO_TANK'),
        GetHashKey('VEHICLE_WEAPON_SPACE_ROCKET'),
        GetHashKey('VEHICLE_WEAPON_TANK'),
        GetHashKey('WEAPON_AIRSTRIKE_ROCKET'),
        GetHashKey('WEAPON_AIR_DEFENCE_GUN'),
        GetHashKey('WEAPON_COMPACTLAUNCHER'),
        GetHashKey('WEAPON_EXPLOSION'),
        GetHashKey('WEAPON_FIREWORK'),
        GetHashKey('WEAPON_GRENADE'),
        GetHashKey('WEAPON_GRENADELAUNCHER'),
        GetHashKey('WEAPON_HOMINGLAUNCHER'),
        GetHashKey('WEAPON_PASSENGER_ROCKET'),
        GetHashKey('WEAPON_PIPEBOMB'),
        GetHashKey('WEAPON_PROXMINE'),
        GetHashKey('WEAPON_RPG'),
        GetHashKey('WEAPON_STICKYBOMB'),
        GetHashKey('WEAPON_VEHICLE_ROCKET')
    },
    ["gas"] = { 
        GetHashKey('WEAPON_BZGAS'),
        GetHashKey('WEAPON_FIREEXTINGUISHER')
        GetHashKey('WEAPON_SMOKEGRENADE')
    },
    ["knife"] = { 
        GetHashKey('WEAPON_BATTLEAXE'),
        GetHashKey('WEAPON_BOTTLE'),
        GetHashKey('WEAPON_KNIFE'),
        GetHashKey('WEAPON_MACHETE'),
        GetHashKey('WEAPON_SWITCHBLADE')
    },
    ["melee"] = { 
        GetHashKey('OBJECT'),
        GetHashKey('VEHICLE_WEAPON_ROTORS'),
        GetHashKey('WEAPON_BALL'),
        GetHashKey('WEAPON_BAT'),
        GetHashKey('WEAPON_CROWBAR'),
        GetHashKey('WEAPON_FLASHLIGHT'),
        GetHashKey('WEAPON_GOLFCLUB'),
        GetHashKey('WEAPON_HAMMER'),
        GetHashKey('WEAPON_HATCHET'),
        GetHashKey('WEAPON_HIT_BY_WATER_CANNON'),
        GetHashKey('WEAPON_KNUCKLE'),
        GetHashKey('WEAPON_NIGHTSTICK'),
        GetHashKey('WEAPON_POOLCUE'),
        GetHashKey('WEAPON_SNOWBALL'),
        GetHashKey('WEAPON_UNARMED'),
        GetHashKey('WEAPON_WRENCH')
    },
    ["drown"] = { 
        GetHashKey('WEAPON_DROWNING'),
        GetHashKey('WEAPON_DROWNING_IN_VEHICLE')
    },
    ["unknown"] = { 
        GetHashKey('WEAPON_BARBED_WIRE'),
        GetHashKey('WEAPON_BLEEDING'),
        GetHashKey('WEAPON_ELECTRIC_FENCE'),
        GetHashKey('WEAPON_EXHAUSTION'),
        GetHashKey('WEAPON_FALL')
    }, -- Fall Damage or SetEntityHealth()
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
            killer = false
        end

        deathReason = getDeathReason(causeHash)
    end

    if killer == nil then
        killer = false
    elseif killer then
        killer = GetPlayerServerId(killer)
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
