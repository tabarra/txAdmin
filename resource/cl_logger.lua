-- Death reasons
local fivemDeathHashTable = {
    [GetHashKey('WEAPON_ANIMAL')] = 'Animal',
    [GetHashKey('WEAPON_COUGAR')] = 'Cougar',
    [GetHashKey('WEAPON_ADVANCEDRIFLE')] = 'Advanced Rifle',
    [GetHashKey('WEAPON_APPISTOL')] = 'AP Pistol',
    [GetHashKey('WEAPON_ASSAULTRIFLE')] = 'Assault Rifle',
    [GetHashKey('WEAPON_ASSAULTRIFLE_MK2')] = 'Assault Rifke Mk2',
    [GetHashKey('WEAPON_ASSAULTSHOTGUN')] = 'Assault Shotgun',
    [GetHashKey('WEAPON_ASSAULTSMG')] = 'Assault SMG',
    [GetHashKey('WEAPON_AUTOSHOTGUN')] = 'Automatic Shotgun',
    [GetHashKey('WEAPON_BULLPUPRIFLE')] = 'Bullpup Rifle',
    [GetHashKey('WEAPON_BULLPUPRIFLE_MK2')] = 'Bullpup Rifle Mk2',
    [GetHashKey('WEAPON_BULLPUPSHOTGUN')] = 'Bullpup Shotgun',
    [GetHashKey('WEAPON_CARBINERIFLE')] = 'Carbine Rifle',
    [GetHashKey('WEAPON_CARBINERIFLE_MK2')] = 'Carbine Rifle Mk2',
    [GetHashKey('WEAPON_COMBATMG')] = 'Combat MG',
    [GetHashKey('WEAPON_COMBATMG_MK2')] = 'Combat MG Mk2',
    [GetHashKey('WEAPON_COMBATPDW')] = 'Combat PDW',
    [GetHashKey('WEAPON_COMBATPISTOL')] = 'Combat Pistol',
    [GetHashKey('WEAPON_COMPACTRIFLE')] = 'Compact Rifle',
    [GetHashKey('WEAPON_DBSHOTGUN')] = 'Double Barrel Shotgun',
    [GetHashKey('WEAPON_DOUBLEACTION')] = 'Double Action Revolver',
    [GetHashKey('WEAPON_GUSENBERG')] = 'Gusenberg',
    [GetHashKey('WEAPON_HEAVYPISTOL')] = 'Heavy Pistol',
    [GetHashKey('WEAPON_HEAVYSHOTGUN')] = 'Heavy Shotgun',
    [GetHashKey('WEAPON_HEAVYSNIPER')] = 'Heavy Sniper',
    [GetHashKey('WEAPON_HEAVYSNIPER_MK2')] = 'Heavy Sniper',
    [GetHashKey('WEAPON_MACHINEPISTOL')] = 'Machine Pistol',
    [GetHashKey('WEAPON_MARKSMANPISTOL')] = 'Marksman Pistol',
    [GetHashKey('WEAPON_MARKSMANRIFLE')] = 'Marksman Rifle',
    [GetHashKey('WEAPON_MARKSMANRIFLE_MK2')] = 'Marksman Rifle Mk2',
    [GetHashKey('WEAPON_MG')] = 'MG',
    [GetHashKey('WEAPON_MICROSMG')] = 'Micro SMG',
    [GetHashKey('WEAPON_MINIGUN')] = 'Minigun',
    [GetHashKey('WEAPON_MINISMG')] = 'Mini SMG',
    [GetHashKey('WEAPON_MUSKET')] = 'Musket',
    [GetHashKey('WEAPON_PISTOL')] = 'Pistol',
    [GetHashKey('WEAPON_PISTOL_MK2')] = 'Pistol Mk2',
    [GetHashKey('WEAPON_PISTOL50')] = 'Pistol .50',
    [GetHashKey('WEAPON_PUMPSHOTGUN')] = 'Pump Shotgun',
    [GetHashKey('WEAPON_PUMPSHOTGUN_MK2')] = 'Pump Shotgun Mk2',
    [GetHashKey('WEAPON_RAILGUN')] = 'Railgun',
    [GetHashKey('WEAPON_REVOLVER')] = 'Revolver',
    [GetHashKey('WEAPON_REVOLVER_MK2')] = 'Revolver Mk2',
    [GetHashKey('WEAPON_SAWNOFFSHOTGUN')] = 'Sawnoff Shotgun',
    [GetHashKey('WEAPON_SMG')] = 'SMG',
    [GetHashKey('WEAPON_SMG_MK2')] = 'SMG Mk2',
    [GetHashKey('WEAPON_SNIPERRIFLE')] = 'Sniper Rifle',
    [GetHashKey('WEAPON_SNSPISTOL')] = 'SNS Pistol',
    [GetHashKey('WEAPON_SNSPISTOL_MK2')] = 'SNS Pistol Mk2',
    [GetHashKey('WEAPON_SPECIALCARBINE')] = 'Special Carbine',
    [GetHashKey('WEAPON_SPECIALCARBINE_MK2')] = 'Special Carbine Mk2',
    [GetHashKey('WEAPON_STINGER')] = 'Stinger',
    [GetHashKey('WEAPON_STUNGUN')] = 'Stungun',
    [GetHashKey('WEAPON_VINTAGEPISTOL')] = 'Vintage Pistol',
    [GetHashKey('VEHICLE_WEAPON_PLAYER_LASER')] = 'Vehicle Lasers',
    [GetHashKey('WEAPON_FIRE')] = 'Fire',
    [GetHashKey('WEAPON_FLARE')] = 'Flare',
    [GetHashKey('WEAPON_FLAREGUN')] = 'Flaregun',
    [GetHashKey('WEAPON_MOLOTOV')] = 'Molotov',
    [GetHashKey('WEAPON_PETROLCAN')] = 'Petrol Can',
    [GetHashKey('WEAPON_HELI_CRASH')] = 'Helicopter Crash',
    [GetHashKey('WEAPON_RAMMED_BY_CAR')] = 'Rammed by Vehicle',
    [GetHashKey('WEAPON_RUN_OVER_BY_CAR')] = 'Ranover by Vehicle',
    [GetHashKey('VEHICLE_WEAPON_SPACE_ROCKET')] = 'Vehicle Space Rocket',
    [GetHashKey('VEHICLE_WEAPON_TANK')] = 'Tank',
    [GetHashKey('WEAPON_AIRSTRIKE_ROCKET')] = 'Airstrike Rocket',
    [GetHashKey('WEAPON_AIR_DEFENCE_GUN')] = 'Air Defence Gun',
    [GetHashKey('WEAPON_COMPACTLAUNCHER')] = 'Compact Launcher',
    [GetHashKey('WEAPON_EXPLOSION')] = 'Explosion',
    [GetHashKey('WEAPON_FIREWORK')] = 'Firework',
    [GetHashKey('WEAPON_GRENADE')] = 'Grenade',
    [GetHashKey('WEAPON_GRENADELAUNCHER')] = 'Grenade Launcher',
    [GetHashKey('WEAPON_HOMINGLAUNCHER')] = 'Homing Launcher',
    [GetHashKey('WEAPON_PASSENGER_ROCKET')] = 'Passenger Rocket',
    [GetHashKey('WEAPON_PIPEBOMB')] = 'Pipe bomb',
    [GetHashKey('WEAPON_PROXMINE')] = 'Proximity Mine',
    [GetHashKey('WEAPON_RPG')] = 'RPG',
    [GetHashKey('WEAPON_STICKYBOMB')] = 'Sticky Bomb',
    [GetHashKey('WEAPON_VEHICLE_ROCKET')] = 'Vehicle Rocket',
    [GetHashKey('WEAPON_BZGAS')] = 'BZ Gas',
    [GetHashKey('WEAPON_FIREEXTINGUISHER')] = 'Fire Extinguisher',
    [GetHashKey('WEAPON_SMOKEGRENADE')] = 'Smoke Grenade',
    [GetHashKey('WEAPON_BATTLEAXE')] = 'Battleaxe',
    [GetHashKey('WEAPON_BOTTLE')] = 'Bottle',
    [GetHashKey('WEAPON_KNIFE')] = 'Knife',
    [GetHashKey('WEAPON_MACHETE')] = 'Machete',
    [GetHashKey('WEAPON_SWITCHBLADE')] = 'Switch Blade',
    [GetHashKey('OBJECT')] = 'Object',
    [GetHashKey('VEHICLE_WEAPON_ROTORS')] = 'Vehicle Rotors',
    [GetHashKey('WEAPON_BALL')] = 'Ball',
    [GetHashKey('WEAPON_BAT')] = 'Bat',
    [GetHashKey('WEAPON_CROWBAR')] = 'Crowbar',
    [GetHashKey('WEAPON_FLASHLIGHT')] = 'Flashlight',
    [GetHashKey('WEAPON_GOLFCLUB')] = 'Golfclub',
    [GetHashKey('WEAPON_HAMMER')] = 'Hammer',
    [GetHashKey('WEAPON_HATCHET')] = 'Hatchet',
    [GetHashKey('WEAPON_HIT_BY_WATER_CANNON')] = 'Water Cannon',
    [GetHashKey('WEAPON_KNUCKLE')] = 'Knuckle',
    [GetHashKey('WEAPON_NIGHTSTICK')] = 'Night Stick',
    [GetHashKey('WEAPON_POOLCUE')] = 'Pool Cue',
    [GetHashKey('WEAPON_SNOWBALL')] = 'Snowball',
    [GetHashKey('WEAPON_UNARMED')] = 'Fist',
    [GetHashKey('WEAPON_WRENCH')] = 'Wrench',
    [GetHashKey('WEAPON_DROWNING')] = 'Drowned',
    [GetHashKey('WEAPON_DROWNING_IN_VEHICLE')] = 'Drowned in Vehicle',
    [GetHashKey('WEAPON_BARBED_WIRE')] = 'Barbed Wire',
    [GetHashKey('WEAPON_BLEEDING')] = 'Bleed',
    [GetHashKey('WEAPON_ELECTRIC_FENCE')] = 'Electric Fence',
    [GetHashKey('WEAPON_EXHAUSTION')] = 'Exhaustion',
    [GetHashKey('WEAPON_FALL')] = 'Falling',
}

-- https://github.com/femga/rdr3_discoveries/blob/master/weapons/weapons.lua
local redmDeathHashTable = {
    [GetHashKey('WEAPON_MELEE_HATCHET_MELEEONLY')] = 'Melee Hatchet Meleeonly',
    [GetHashKey('WEAPON_MELEE_KNIFE_MINER')] = 'Melee Knife Miner',
    [GetHashKey('WEAPON_MELEE_KNIFE_JAWBONE')] = 'Melee Knife Jawbone',
    [GetHashKey('WEAPON_MELEE_KNIFE_VAMPIRE')] = 'Melee Knife Vampire',
    [GetHashKey('WEAPON_MELEE_KNIFE_JOHN')] = 'Melee Knife John',
    [GetHashKey('WEAPON_MELEE_MACHETE')] = 'Melee Machete',
    [GetHashKey('WEAPON_MELEE_KNIFE_BEAR')] = 'Melee Knife Bear',
    [GetHashKey('WEAPON_MELEE_KNIFE_DUTCH')] = 'Melee Knife Dutch',
    [GetHashKey('WEAPON_MELEE_KNIFE_KIERAN')] = 'Melee Knife Kieran',
    [GetHashKey('WEAPON_MELEE_KNIFE_UNCLE')] = 'Melee Knife Uncle',
    [GetHashKey('WEAPON_MELEE_KNIFE_SEAN')] = 'Melee Knife Sean',
    [GetHashKey('WEAPON_MELEE_TORCH')] = 'Melee Torch',
    [GetHashKey('WEAPON_MELEE_KNIFE_LENNY')] = 'Melee Knife Lenny',
    [GetHashKey('WEAPON_MELEE_KNIFE_SADIE')] = 'Melee Knife Sadie',
    [GetHashKey('WEAPON_MELEE_KNIFE_CHARLES')] = 'Melee Knife Charles',
    [GetHashKey('WEAPON_MELEE_KNIFE_HOSEA')] = 'Melee Knife Hosea',
    [GetHashKey('WEAPON_MELEE_TORCH_CROWD')] = 'Melee Torch Crowd',
    [GetHashKey('WEAPON_MELEE_KNIFE_BILL')] = 'Melee Knife Bill',
    [GetHashKey('WEAPON_MELEE_KNIFE_CIVIL_WAR')] = 'Melee Knife Civil War',
    [GetHashKey('WEAPON_MELEE_KNIFE')] = 'Melee Knife',
    [GetHashKey('WEAPON_MELEE_KNIFE_MICAH')] = 'Melee Knife Micah',
    [GetHashKey('WEAPON_MELEE_BROKEN_SWORD')] = 'Melee Broken Sword',
    [GetHashKey('WEAPON_MELEE_KNIFE_JAVIER')] = 'Melee Knife Javier',
    [GetHashKey('WEAPON_PISTOL_VOLCANIC')] = 'Pistol Volcanic',
    [GetHashKey('WEAPON_PISTOL_MAUSER_DRUNK')] = 'Pistol Mauser Drunk',
    [GetHashKey('WEAPON_PISTOL_M1899')] = 'Pistol M1899',
    [GetHashKey('WEAPON_PISTOL_SEMIAUTO')] = 'Pistol Semiauto',
    [GetHashKey('WEAPON_PISTOL_MAUSER')] = 'Pistol Mauser',
    [GetHashKey('WEAPON_REPEATER_EVANS')] = 'Repeater Evans',
    [GetHashKey('WEAPON_REPEATER_CARBINE_SADIE')] = 'Repeater Carbine Sadie',
    [GetHashKey('WEAPON_REPEATER_HENRY')] = 'Repeater Henry',
    [GetHashKey('WEAPON_REPEATER_WINCHESTER')] = 'Repeater Winchester',
    [GetHashKey('WEAPON_REPEATER_WINCHESTER_JOHN')] = 'Repeater Winchester John',
    [GetHashKey('WEAPON_REPEATER_CARBINE')] = 'Repeater Carbine',
    [GetHashKey('WEAPON_REVOLVER_DOUBLEACTION_MICAH_DUALWIELD')] = 'Revolver Doubleaction Micah Dualwield',
    [GetHashKey('WEAPON_REVOLVER_DOUBLEACTION_MICAH')] = 'Revolver Doubleaction Micah',
    [GetHashKey('WEAPON_REVOLVER_SCHOFIELD_CALLOWAY')] = 'Revolver Schofield Calloway',
    [GetHashKey('WEAPON_REVOLVER_DOUBLEACTION')] = 'Revolver Doubleaction',
    [GetHashKey('WEAPON_REVOLVER_CATTLEMAN')] = 'Revolver Cattleman',
    [GetHashKey('WEAPON_REVOLVER_CATTLEMAN_MEXICAN')] = 'Revolver Cattleman Mexican',
    [GetHashKey('WEAPON_REVOLVER_CATTLEMAN_HOSEA_DUALWIELD')] = 'Revolver Cattleman Hosea Dualwield',
    [GetHashKey('WEAPON_REVOLVER_DOUBLEACTION_EXOTIC')] = 'Revolver Doubleaction Exotic',
    [GetHashKey('WEAPON_REVOLVER_CATTLEMAN_SEAN')] = 'Revolver Cattleman Sean',
    [GetHashKey('WEAPON_REVOLVER_CATTLEMAN_SADIE')] = 'Revolver Cattleman Sadie',
    [GetHashKey('WEAPON_REVOLVER_DOUBLEACTION_JAVIER')] = 'Revolver Doubleaction Javier',
    [GetHashKey('WEAPON_REVOLVER_LEMAT')] = 'Revolver Lemat',
    [GetHashKey('WEAPON_REVOLVER_SCHOFIELD_BILL')] = 'Revolver Schofield Bill',
    [GetHashKey('WEAPON_REVOLVER_SCHOFIELD')] = 'Revolver Schofield',
    [GetHashKey('WEAPON_REVOLVER_CATTLEMAN_SADIE_DUALWIELD')] = 'Revolver Cattleman Sadie Dualwield',
    [GetHashKey('WEAPON_REVOLVER_DOUBLEACTION_GAMBLER')] = 'Revolver Doubleaction Gambler',
    [GetHashKey('WEAPON_REVOLVER_CATTLEMAN_KIERAN')] = 'Revolver Cattleman Kieran',
    [GetHashKey('WEAPON_REVOLVER_SCHOFIELD_UNCLE')] = 'Revolver Schofield Uncle',
    [GetHashKey('WEAPON_REVOLVER_CATTLEMAN_HOSEA')] = 'Revolver Cattleman Hosea',
    [GetHashKey('WEAPON_REVOLVER_CATTLEMAN_LENNY')] = 'Revolver Cattleman Lenny',
    [GetHashKey('WEAPON_REVOLVER_CATTLEMAN_JOHN')] = 'Revolver Cattleman John',
    [GetHashKey('WEAPON_REVOLVER_SCHOFIELD_DUTCH_DUALWIELD')] = 'Revolver Schofield Dutch Dualwield',
    [GetHashKey('WEAPON_REVOLVER_SCHOFIELD_GOLDEN')] = 'Revolver Schofield Golden',
    [GetHashKey('WEAPON_REVOLVER_CATTLEMAN_PIG')] = 'Revolver Cattleman Pig',
    [GetHashKey('WEAPON_REVOLVER_SCHOFIELD_DUTCH')] = 'Revolver Schofield Dutch',
    [GetHashKey('WEAPON_RIFLE_SPRINGFIELD')] = 'Rifle Springfield',
    [GetHashKey('WEAPON_RIFLE_BOLTACTION')] = 'Rifle Boltaction',
    [GetHashKey('WEAPON_RIFLE_BOLTACTION_BILL')] = 'Rifle Boltaction Bill',
    [GetHashKey('WEAPON_RIFLE_VARMINT')] = 'Rifle Varmint',
    [GetHashKey('WEAPON_SHOTGUN_SAWEDOFF')] = 'Shotgun Sawedoff',
    [GetHashKey('WEAPON_SHOTGUN_DOUBLEBARREL_EXOTIC')] = 'Shotgun Doublebarrel Exotic',
    [GetHashKey('WEAPON_SHOTGUN_PUMP')] = 'Shotgun Pump',
    [GetHashKey('WEAPON_SHOTGUN_REPEATING')] = 'Shotgun Repeating',
    [GetHashKey('WEAPON_SHOTGUN_SEMIAUTO')] = 'Shotgun Semiauto',
    [GetHashKey('WEAPON_SHOTGUN_DOUBLEBARREL')] = 'Shotgun Doublebarrel',
    [GetHashKey('WEAPON_SHOTGUN_DOUBLEBARREL_UNCLE')] = 'Shotgun Doublebarrel Uncle',
    [GetHashKey('WEAPON_SHOTGUN_SAWEDOFF_CHARLES')] = 'Shotgun Sawedoff Charles',
    [GetHashKey('WEAPON_SHOTGUN_SEMIAUTO_HOSEA')] = 'Shotgun Semiauto Hosea',
    [GetHashKey('WEAPON_SNIPERRIFLE_ROLLINGBLOCK_LENNY')] = 'Sniperrifle Rollingblock Lenny',
    [GetHashKey('WEAPON_SNIPERRIFLE_ROLLINGBLOCK_EXOTIC')] = 'Sniperrifle Rollingblock Exotic',
    [GetHashKey('WEAPON_SNIPERRIFLE_CARCANO')] = 'Sniperrifle Carcano',
    [GetHashKey('WEAPON_SNIPERRIFLE_ROLLINGBLOCK')] = 'Sniperrifle Rollingblock',
    [GetHashKey('WEAPON_MELEE_HATCHET')] = 'Melee Hatchet',
    [GetHashKey('WEAPON_MELEE_HATCHET_HEWING')] = 'Melee Hatchet Hewing',
    [GetHashKey('WEAPON_MELEE_ANCIENT_HATCHET')] = 'Melee Ancient Hatchet',
    [GetHashKey('WEAPON_MELEE_HATCHET_HUNTER')] = 'Melee Hatchet Hunter',
    [GetHashKey('WEAPON_THROWN_THROWING_KNIVES_JAVIER')] = 'Thrown Throwing Knives Javier',
    [GetHashKey('WEAPON_THROWN_MOLOTOV')] = 'Thrown Molotov',
    [GetHashKey('WEAPON_MELEE_HATCHET_VIKING')] = 'Melee Hatchet Viking',
    [GetHashKey('WEAPON_THROWN_TOMAHAWK_ANCIENT')] = 'Thrown Tomahawk Ancient',
    [GetHashKey('WEAPON_MELEE_HATCHET_DOUBLE_BIT_RUSTED')] = 'Melee Hatchet Double Bit Rusted',
    [GetHashKey('WEAPON_THROWN_TOMAHAWK')] = 'Thrown Tomahawk',
    [GetHashKey('WEAPON_THROWN_DYNAMITE')] = 'Thrown Dynamite',
    [GetHashKey('WEAPON_MELEE_HATCHET_DOUBLE_BIT')] = 'Melee Hatchet Double Bit',
    [GetHashKey('WEAPON_THROWN_THROWING_KNIVES')] = 'Thrown Throwing Knives',
    [GetHashKey('WEAPON_MELEE_HATCHET_HUNTER_RUSTED')] = 'Melee Hatchet Hunter Rusted',
    [GetHashKey('WEAPON_MELEE_CLEAVER')] = 'Melee Cleaver',
    [GetHashKey('WEAPON_MELEE_LANTERN')] = 'Melee Lantern',
    [GetHashKey('WEAPON_MELEE_DAVY_LANTERN')] = 'Melee Davy Lantern',
    [GetHashKey('WEAPON_MELEE_LANTERN_ELECTRIC')] = 'Melee Lantern Electric',
    [GetHashKey('WEAPON_KIT_BINOCULARS')] = 'Kit Binoculars',
    [GetHashKey('WEAPON_KIT_CAMERA')] = 'Kit Camera',
    [GetHashKey('WEAPON_KIT_DETECTOR')] = 'Kit Detector',
    [GetHashKey('WEAPON_BOW_CHARLES')] = 'Bow Charles',
    [GetHashKey('WEAPON_BOW')] = 'Bow',
    [GetHashKey('WEAPON_FISHINGROD')] = 'Fishingrod',
    [GetHashKey('WEAPON_LASSO')] = 'Lasso',
    [GetHashKey('WEAPON_WOLF')] = 'Wolf',
    [GetHashKey('WEAPON_WOLF_MEDIUM')] = 'Wolf Medium',
    [GetHashKey('WEAPON_WOLF_SMALL')] = 'Wolf Small',
    [GetHashKey('WEAPON_ALLIGATOR')] = 'Alligator',
    [GetHashKey('WEAPON_ANIMAL')] = 'Animal',
    [GetHashKey('WEAPON_BADGER')] = 'Badger',
    [GetHashKey('WEAPON_BEAR')] = 'Bear',
    [GetHashKey('WEAPON_BEAVER')] = 'Beaver',
    [GetHashKey('WEAPON_COUGAR')] = 'Cougar',
    [GetHashKey('WEAPON_COYOTE')] = 'Coyote',
    [GetHashKey('WEAPON_DEER')] = 'Deer',
    [GetHashKey('WEAPON_FOX')] = 'Fox',
    [GetHashKey('WEAPON_HORSE')] = 'Horse',
    [GetHashKey('WEAPON_MUSKRAT')] = 'Muskrat',
    [GetHashKey('WEAPON_RACCOON')] = 'Raccoon',
    [GetHashKey('WEAPON_SNAKE')] = 'Snake',
    [GetHashKey('WEAPON_FALL')] = 'Fall',
    [GetHashKey('WEAPON_FIRE')] = 'Fire',
    [GetHashKey('WEAPON_BLEEDING')] = 'Bleeding',
    [GetHashKey('WEAPON_DROWNING')] = 'Drowning',
    [GetHashKey('WEAPON_DROWNING_IN_VEHICLE')] = 'Drowning In Vehicle',
    [GetHashKey('WEAPON_EXPLOSION')] = 'Explosion',
    [GetHashKey('WEAPON_RAMMED_BY_CAR')] = 'Rammed By Car',
    [GetHashKey('WEAPON_RUN_OVER_BY_CAR')] = 'Run Over By Car',

    --  Weapons from game version 1207.80 till 1311.1212
    [GetHashKey('WEAPON_KIT_CAMERA_ADVANCED')] = 'Kit Camera Advanced',
    [GetHashKey('WEAPON_MELEE_MACHETE_HORROR')] = 'Melee Machete Horror',
    [GetHashKey('WEAPON_BOW_IMPROVED')] = 'Bow Improved',
    [GetHashKey('WEAPON_RIFLE_ELEPHANT')] = 'Rifle Elephant',
    [GetHashKey('WEAPON_REVOLVER_NAVY')] = 'Revolver Navy',
    [GetHashKey('WEAPON_LASSO_REINFORCED')] = 'Lasso Reinforced',
    [GetHashKey('WEAPON_KIT_BINOCULARS_IMPROVED')] = 'Kit Binoculars Improved',
    [GetHashKey('WEAPON_MELEE_KNIFE_TRADER')] = 'Melee Knife Trader',
    [GetHashKey('WEAPON_MELEE_MACHETE_COLLECTOR')] = 'Melee Machete Collector',
    [GetHashKey('WEAPON_MOONSHINEJUG_MP')] = 'Moonshinejug Mp',
    [GetHashKey('WEAPON_THROWN_BOLAS')] = 'Thrown Bolas',
    [GetHashKey('WEAPON_THROWN_POISONBOTTLE')] = 'Thrown Poisonbottle',

    --  Weapons from game version 1311.12 till 1355.18
    [GetHashKey('WEAPON_KIT_METAL_DETECTOR')] = 'Kit Metal Detector',
    [GetHashKey('WEAPON_REVOLVER_NAVY_CROSSOVER')] = 'Revolver Navy Crossover',
    [GetHashKey('WEAPON_THROWN_BOLAS_HAWKMOTH')] = 'Thrown Bolas Hawkmoth',
    [GetHashKey('WEAPON_THROWN_BOLAS_IRONSPIKED')] = 'Thrown Bolas Ironspiked',
    [GetHashKey('WEAPON_THROWN_BOLAS_INTERTWINED')] = 'Thrown Bolas Intertwined',

    --  Weapons from game version 1355.18 till 1436.26
    [GetHashKey('WEAPON_MELEE_KNIFE_HORROR')] = 'Melee Knife Horror',
    [GetHashKey('WEAPON_MELEE_KNIFE_RUSTIC')] = 'Melee Knife Rustic',
    [GetHashKey('WEAPON_MELEE_LANTERN_HALLOWEEN')] = 'Melee Lantern Halloween',
}
local deathHashTable = IS_FIVEM and fivemDeathHashTable or redmDeathHashTable

local function processDeath(ped)
    local killerPed = GetPedSourceOfDeath(ped)
    local causeHash = GetPedCauseOfDeath(ped)
    local killer = false
    debugPrint(("Death cause: %s / 0x%x"):format(causeHash, causeHash))

    if killerPed == ped then
        killer = false
    else
        if IsEntityAPed(killerPed) and IsPedAPlayer(killerPed) then
            killer = NetworkGetPlayerIndexFromPed(killerPed)
        elseif IsEntityAVehicle(killerPed) then
            local drivingPed = GetPedInVehicleSeat(killerPed, -1)
            if IsEntityAPed(drivingPed) == 1 and IsPedAPlayer(drivingPed) then
                killer = NetworkGetPlayerIndexFromPed(drivingPed)
            end
        end
    end

    local deathReason = deathHashTable[causeHash] or 'unknown'

    if not killer then
        if deathReason ~= "unknown" then
            deathReason = "suicide (" .. deathReason .. ")"
        else
            deathReason = "suicide"
        end
    else
        killer = GetPlayerServerId(killer)
    end

    TriggerServerEvent('txsv:logger:deathEvent', killer, deathReason)
end

-- Trigger Event From External Script
-- NOTE: couldn't people just call the txsv:logger:deathEvent event???
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
        local ped = PlayerPedId()
        local isDead = IsEntityDead(ped)
        if isDead and not deathFlag then
            deathFlag = true
            processDeath(ped)
        elseif not isDead then
            deathFlag = false
        end
    end
end)
