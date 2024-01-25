-- Death reasons
local fivemDeathHashTable = {
    [`WEAPON_ANIMAL`] = 'Animal',
    [`WEAPON_COUGAR`] = 'Cougar',
    [`WEAPON_ADVANCEDRIFLE`] = 'Advanced Rifle',
    [`WEAPON_APPISTOL`] = 'AP Pistol',
    [`WEAPON_ASSAULTRIFLE`] = 'Assault Rifle',
    [`WEAPON_ASSAULTRIFLE_MK2`] = 'Assault Rifke Mk2',
    [`WEAPON_ASSAULTSHOTGUN`] = 'Assault Shotgun',
    [`WEAPON_ASSAULTSMG`] = 'Assault SMG',
    [`WEAPON_AUTOSHOTGUN`] = 'Automatic Shotgun',
    [`WEAPON_BULLPUPRIFLE`] = 'Bullpup Rifle',
    [`WEAPON_BULLPUPRIFLE_MK2`] = 'Bullpup Rifle Mk2',
    [`WEAPON_BULLPUPSHOTGUN`] = 'Bullpup Shotgun',
    [`WEAPON_CARBINERIFLE`] = 'Carbine Rifle',
    [`WEAPON_CARBINERIFLE_MK2`] = 'Carbine Rifle Mk2',
    [`WEAPON_COMBATMG`] = 'Combat MG',
    [`WEAPON_COMBATMG_MK2`] = 'Combat MG Mk2',
    [`WEAPON_COMBATPDW`] = 'Combat PDW',
    [`WEAPON_COMBATPISTOL`] = 'Combat Pistol',
    [`WEAPON_COMPACTRIFLE`] = 'Compact Rifle',
    [`WEAPON_DBSHOTGUN`] = 'Double Barrel Shotgun',
    [`WEAPON_DOUBLEACTION`] = 'Double Action Revolver',
    [`WEAPON_GUSENBERG`] = 'Gusenberg',
    [`WEAPON_HEAVYPISTOL`] = 'Heavy Pistol',
    [`WEAPON_HEAVYSHOTGUN`] = 'Heavy Shotgun',
    [`WEAPON_HEAVYSNIPER`] = 'Heavy Sniper',
    [`WEAPON_HEAVYSNIPER_MK2`] = 'Heavy Sniper',
    [`WEAPON_MACHINEPISTOL`] = 'Machine Pistol',
    [`WEAPON_MARKSMANPISTOL`] = 'Marksman Pistol',
    [`WEAPON_MARKSMANRIFLE`] = 'Marksman Rifle',
    [`WEAPON_MARKSMANRIFLE_MK2`] = 'Marksman Rifle Mk2',
    [`WEAPON_MG`] = 'MG',
    [`WEAPON_MICROSMG`] = 'Micro SMG',
    [`WEAPON_MINIGUN`] = 'Minigun',
    [`WEAPON_MINISMG`] = 'Mini SMG',
    [`WEAPON_MUSKET`] = 'Musket',
    [`WEAPON_PISTOL`] = 'Pistol',
    [`WEAPON_PISTOL_MK2`] = 'Pistol Mk2',
    [`WEAPON_PISTOL50`] = 'Pistol .50',
    [`WEAPON_PUMPSHOTGUN`] = 'Pump Shotgun',
    [`WEAPON_PUMPSHOTGUN_MK2`] = 'Pump Shotgun Mk2',
    [`WEAPON_RAILGUN`] = 'Railgun',
    [`WEAPON_REVOLVER`] = 'Revolver',
    [`WEAPON_REVOLVER_MK2`] = 'Revolver Mk2',
    [`WEAPON_SAWNOFFSHOTGUN`] = 'Sawnoff Shotgun',
    [`WEAPON_SMG`] = 'SMG',
    [`WEAPON_SMG_MK2`] = 'SMG Mk2',
    [`WEAPON_SNIPERRIFLE`] = 'Sniper Rifle',
    [`WEAPON_SNSPISTOL`] = 'SNS Pistol',
    [`WEAPON_SNSPISTOL_MK2`] = 'SNS Pistol Mk2',
    [`WEAPON_SPECIALCARBINE`] = 'Special Carbine',
    [`WEAPON_SPECIALCARBINE_MK2`] = 'Special Carbine Mk2',
    [`WEAPON_STINGER`] = 'Stinger',
    [`WEAPON_STUNGUN`] = 'Stungun',
    [`WEAPON_VINTAGEPISTOL`] = 'Vintage Pistol',
    [`VEHICLE_WEAPON_PLAYER_LASER`] = 'Vehicle Lasers',
    [`WEAPON_FIRE`] = 'Fire',
    [`WEAPON_FLARE`] = 'Flare',
    [`WEAPON_FLAREGUN`] = 'Flaregun',
    [`WEAPON_MOLOTOV`] = 'Molotov',
    [`WEAPON_PETROLCAN`] = 'Petrol Can',
    [`WEAPON_HELI_CRASH`] = 'Helicopter Crash',
    [`WEAPON_RAMMED_BY_CAR`] = 'Rammed by Vehicle',
    [`WEAPON_RUN_OVER_BY_CAR`] = 'Ranover by Vehicle',
    [`VEHICLE_WEAPON_SPACE_ROCKET`] = 'Vehicle Space Rocket',
    [`VEHICLE_WEAPON_TANK`] = 'Tank',
    [`WEAPON_AIRSTRIKE_ROCKET`] = 'Airstrike Rocket',
    [`WEAPON_AIR_DEFENCE_GUN`] = 'Air Defence Gun',
    [`WEAPON_COMPACTLAUNCHER`] = 'Compact Launcher',
    [`WEAPON_EXPLOSION`] = 'Explosion',
    [`WEAPON_FIREWORK`] = 'Firework',
    [`WEAPON_GRENADE`] = 'Grenade',
    [`WEAPON_GRENADELAUNCHER`] = 'Grenade Launcher',
    [`WEAPON_HOMINGLAUNCHER`] = 'Homing Launcher',
    [`WEAPON_PASSENGER_ROCKET`] = 'Passenger Rocket',
    [`WEAPON_PIPEBOMB`] = 'Pipe bomb',
    [`WEAPON_PROXMINE`] = 'Proximity Mine',
    [`WEAPON_RPG`] = 'RPG',
    [`WEAPON_STICKYBOMB`] = 'Sticky Bomb',
    [`WEAPON_VEHICLE_ROCKET`] = 'Vehicle Rocket',
    [`WEAPON_BZGAS`] = 'BZ Gas',
    [`WEAPON_FIREEXTINGUISHER`] = 'Fire Extinguisher',
    [`WEAPON_SMOKEGRENADE`] = 'Smoke Grenade',
    [`WEAPON_BATTLEAXE`] = 'Battleaxe',
    [`WEAPON_BOTTLE`] = 'Bottle',
    [`WEAPON_KNIFE`] = 'Knife',
    [`WEAPON_MACHETE`] = 'Machete',
    [`WEAPON_SWITCHBLADE`] = 'Switch Blade',
    [`OBJECT`] = 'Object',
    [`VEHICLE_WEAPON_ROTORS`] = 'Vehicle Rotors',
    [`WEAPON_BALL`] = 'Ball',
    [`WEAPON_BAT`] = 'Bat',
    [`WEAPON_CROWBAR`] = 'Crowbar',
    [`WEAPON_FLASHLIGHT`] = 'Flashlight',
    [`WEAPON_GOLFCLUB`] = 'Golfclub',
    [`WEAPON_HAMMER`] = 'Hammer',
    [`WEAPON_HATCHET`] = 'Hatchet',
    [`WEAPON_HIT_BY_WATER_CANNON`] = 'Water Cannon',
    [`WEAPON_KNUCKLE`] = 'Knuckle',
    [`WEAPON_NIGHTSTICK`] = 'Night Stick',
    [`WEAPON_POOLCUE`] = 'Pool Cue',
    [`WEAPON_SNOWBALL`] = 'Snowball',
    [`WEAPON_UNARMED`] = 'Fist',
    [`WEAPON_WRENCH`] = 'Wrench',
    [`WEAPON_DROWNING`] = 'Drowned',
    [`WEAPON_DROWNING_IN_VEHICLE`] = 'Drowned in Vehicle',
    [`WEAPON_BARBED_WIRE`] = 'Barbed Wire',
    [`WEAPON_BLEEDING`] = 'Bleed',
    [`WEAPON_ELECTRIC_FENCE`] = 'Electric Fence',
    [`WEAPON_EXHAUSTION`] = 'Exhaustion',
    [`WEAPON_FALL`] = 'Falling',
    [`WEAPON_RAYPISTOL`] = 'Ray Pistol',
    [`WEAPON_RAYCARBINE`] = 'Ray Carbine',
    [`WEAPON_RAYMINIGUN`] = 'Ray Minigun',
    [`WEAPON_STONE_HATCHET`] = 'Stone Hatchet',
    -- MPHEIST3 DLC (v 1868)
    [`WEAPON_CERAMICPISTOL`] = 'Ceramic Pistol',
    [`WEAPON_NAVYREVOLVER`] = 'Navy Revolver',
    [`WEAPON_HAZARDCAN`] = 'Hazard Can',
    -- MPHEIST4 DLC (v 2189)
    [`WEAPON_GADGETPISTOL`] = 'Gadget Pistol',
    [`WEAPON_MILITARYRIFLE`] = 'Military Rifle',
    [`WEAPON_COMBATSHOTGUN`] = 'Combat Shotgun',
    -- MPSECURITY DLC (v 2545)
    [`WEAPON_EMPLAUNCHER`] = 'EMP Launcher',
    [`WEAPON_HEAVYRIFLE`] = 'Heavy Rifle',
    [`WEAPON_FERTILIZERCAN`] = 'Fertilizer Can',
    [`WEAPON_STUNGUN_MP`] = 'Stungun MP',
    -- MPSUM2 DLC (V 2699)
    [`WEAPON_TACTICALRIFLE`] = 'Tactical Rifle',
    [`WEAPON_PRECISIONRIFLE`] = 'Precision Rifle',
    -- MPCHRISTMAS3 DLC (V 2802)
    [`WEAPON_PISTOLXM3`] = 'Pistol XM3',
    [`WEAPON_CANDYCANE`] = 'Candy Cane',
    [`WEAPON_RAILGUNXM3`] = 'Railgun XM3',
    -- MP2023_01 DLC (V 2944)
    [`WEAPON_TECPISTOL`] = 'Tec Pistol',
    -- MP2023_02 DLC (V 3095)
    [`WEAPON_BATTLERIFLE`] = 'Battle Rifle',
    [`WEAPON_SNOWLAUNCHER`] = 'Snow Launcher',
    [`WEAPON_HACKINGDEVICE`] = 'Hacking Device',
}

-- https://github.com/femga/rdr3_discoveries/blob/master/weapons/weapons.lua
local redmDeathHashTable = {
    [`WEAPON_MELEE_HATCHET_MELEEONLY`] = 'Melee Hatchet Meleeonly',
    [`WEAPON_MELEE_KNIFE_MINER`] = 'Melee Knife Miner',
    [`WEAPON_MELEE_KNIFE_JAWBONE`] = 'Melee Knife Jawbone',
    [`WEAPON_MELEE_KNIFE_VAMPIRE`] = 'Melee Knife Vampire',
    [`WEAPON_MELEE_KNIFE_JOHN`] = 'Melee Knife John',
    [`WEAPON_MELEE_MACHETE`] = 'Melee Machete',
    [`WEAPON_MELEE_KNIFE_BEAR`] = 'Melee Knife Bear',
    [`WEAPON_MELEE_KNIFE_DUTCH`] = 'Melee Knife Dutch',
    [`WEAPON_MELEE_KNIFE_KIERAN`] = 'Melee Knife Kieran',
    [`WEAPON_MELEE_KNIFE_UNCLE`] = 'Melee Knife Uncle',
    [`WEAPON_MELEE_KNIFE_SEAN`] = 'Melee Knife Sean',
    [`WEAPON_MELEE_TORCH`] = 'Melee Torch',
    [`WEAPON_MELEE_KNIFE_LENNY`] = 'Melee Knife Lenny',
    [`WEAPON_MELEE_KNIFE_SADIE`] = 'Melee Knife Sadie',
    [`WEAPON_MELEE_KNIFE_CHARLES`] = 'Melee Knife Charles',
    [`WEAPON_MELEE_KNIFE_HOSEA`] = 'Melee Knife Hosea',
    [`WEAPON_MELEE_TORCH_CROWD`] = 'Melee Torch Crowd',
    [`WEAPON_MELEE_KNIFE_BILL`] = 'Melee Knife Bill',
    [`WEAPON_MELEE_KNIFE_CIVIL_WAR`] = 'Melee Knife Civil War',
    [`WEAPON_MELEE_KNIFE`] = 'Melee Knife',
    [`WEAPON_MELEE_KNIFE_MICAH`] = 'Melee Knife Micah',
    [`WEAPON_MELEE_BROKEN_SWORD`] = 'Melee Broken Sword',
    [`WEAPON_MELEE_KNIFE_JAVIER`] = 'Melee Knife Javier',
    [`WEAPON_PISTOL_VOLCANIC`] = 'Pistol Volcanic',
    [`WEAPON_PISTOL_MAUSER_DRUNK`] = 'Pistol Mauser Drunk',
    [`WEAPON_PISTOL_M1899`] = 'Pistol M1899',
    [`WEAPON_PISTOL_SEMIAUTO`] = 'Pistol Semiauto',
    [`WEAPON_PISTOL_MAUSER`] = 'Pistol Mauser',
    [`WEAPON_REPEATER_EVANS`] = 'Repeater Evans',
    [`WEAPON_REPEATER_CARBINE_SADIE`] = 'Repeater Carbine Sadie',
    [`WEAPON_REPEATER_HENRY`] = 'Repeater Henry',
    [`WEAPON_REPEATER_WINCHESTER`] = 'Repeater Winchester',
    [`WEAPON_REPEATER_WINCHESTER_JOHN`] = 'Repeater Winchester John',
    [`WEAPON_REPEATER_CARBINE`] = 'Repeater Carbine',
    [`WEAPON_REVOLVER_DOUBLEACTION_MICAH_DUALWIELD`] = 'Revolver Doubleaction Micah Dualwield',
    [`WEAPON_REVOLVER_DOUBLEACTION_MICAH`] = 'Revolver Doubleaction Micah',
    [`WEAPON_REVOLVER_SCHOFIELD_CALLOWAY`] = 'Revolver Schofield Calloway',
    [`WEAPON_REVOLVER_DOUBLEACTION`] = 'Revolver Doubleaction',
    [`WEAPON_REVOLVER_CATTLEMAN`] = 'Revolver Cattleman',
    [`WEAPON_REVOLVER_CATTLEMAN_MEXICAN`] = 'Revolver Cattleman Mexican',
    [`WEAPON_REVOLVER_CATTLEMAN_HOSEA_DUALWIELD`] = 'Revolver Cattleman Hosea Dualwield',
    [`WEAPON_REVOLVER_DOUBLEACTION_EXOTIC`] = 'Revolver Doubleaction Exotic',
    [`WEAPON_REVOLVER_CATTLEMAN_SEAN`] = 'Revolver Cattleman Sean',
    [`WEAPON_REVOLVER_CATTLEMAN_SADIE`] = 'Revolver Cattleman Sadie',
    [`WEAPON_REVOLVER_DOUBLEACTION_JAVIER`] = 'Revolver Doubleaction Javier',
    [`WEAPON_REVOLVER_LEMAT`] = 'Revolver Lemat',
    [`WEAPON_REVOLVER_SCHOFIELD_BILL`] = 'Revolver Schofield Bill',
    [`WEAPON_REVOLVER_SCHOFIELD`] = 'Revolver Schofield',
    [`WEAPON_REVOLVER_CATTLEMAN_SADIE_DUALWIELD`] = 'Revolver Cattleman Sadie Dualwield',
    [`WEAPON_REVOLVER_DOUBLEACTION_GAMBLER`] = 'Revolver Doubleaction Gambler',
    [`WEAPON_REVOLVER_CATTLEMAN_KIERAN`] = 'Revolver Cattleman Kieran',
    [`WEAPON_REVOLVER_SCHOFIELD_UNCLE`] = 'Revolver Schofield Uncle',
    [`WEAPON_REVOLVER_CATTLEMAN_HOSEA`] = 'Revolver Cattleman Hosea',
    [`WEAPON_REVOLVER_CATTLEMAN_LENNY`] = 'Revolver Cattleman Lenny',
    [`WEAPON_REVOLVER_CATTLEMAN_JOHN`] = 'Revolver Cattleman John',
    [`WEAPON_REVOLVER_SCHOFIELD_DUTCH_DUALWIELD`] = 'Revolver Schofield Dutch Dualwield',
    [`WEAPON_REVOLVER_SCHOFIELD_GOLDEN`] = 'Revolver Schofield Golden',
    [`WEAPON_REVOLVER_CATTLEMAN_PIG`] = 'Revolver Cattleman Pig',
    [`WEAPON_REVOLVER_SCHOFIELD_DUTCH`] = 'Revolver Schofield Dutch',
    [`WEAPON_RIFLE_SPRINGFIELD`] = 'Rifle Springfield',
    [`WEAPON_RIFLE_BOLTACTION`] = 'Rifle Boltaction',
    [`WEAPON_RIFLE_BOLTACTION_BILL`] = 'Rifle Boltaction Bill',
    [`WEAPON_RIFLE_VARMINT`] = 'Rifle Varmint',
    [`WEAPON_SHOTGUN_SAWEDOFF`] = 'Shotgun Sawedoff',
    [`WEAPON_SHOTGUN_DOUBLEBARREL_EXOTIC`] = 'Shotgun Doublebarrel Exotic',
    [`WEAPON_SHOTGUN_PUMP`] = 'Shotgun Pump',
    [`WEAPON_SHOTGUN_REPEATING`] = 'Shotgun Repeating',
    [`WEAPON_SHOTGUN_SEMIAUTO`] = 'Shotgun Semiauto',
    [`WEAPON_SHOTGUN_DOUBLEBARREL`] = 'Shotgun Doublebarrel',
    [`WEAPON_SHOTGUN_DOUBLEBARREL_UNCLE`] = 'Shotgun Doublebarrel Uncle',
    [`WEAPON_SHOTGUN_SAWEDOFF_CHARLES`] = 'Shotgun Sawedoff Charles',
    [`WEAPON_SHOTGUN_SEMIAUTO_HOSEA`] = 'Shotgun Semiauto Hosea',
    [`WEAPON_SNIPERRIFLE_ROLLINGBLOCK_LENNY`] = 'Sniperrifle Rollingblock Lenny',
    [`WEAPON_SNIPERRIFLE_ROLLINGBLOCK_EXOTIC`] = 'Sniperrifle Rollingblock Exotic',
    [`WEAPON_SNIPERRIFLE_CARCANO`] = 'Sniperrifle Carcano',
    [`WEAPON_SNIPERRIFLE_ROLLINGBLOCK`] = 'Sniperrifle Rollingblock',
    [`WEAPON_MELEE_HATCHET`] = 'Melee Hatchet',
    [`WEAPON_MELEE_HATCHET_HEWING`] = 'Melee Hatchet Hewing',
    [`WEAPON_MELEE_ANCIENT_HATCHET`] = 'Melee Ancient Hatchet',
    [`WEAPON_MELEE_HATCHET_HUNTER`] = 'Melee Hatchet Hunter',
    [`WEAPON_THROWN_THROWING_KNIVES_JAVIER`] = 'Thrown Throwing Knives Javier',
    [`WEAPON_THROWN_MOLOTOV`] = 'Thrown Molotov',
    [`WEAPON_MELEE_HATCHET_VIKING`] = 'Melee Hatchet Viking',
    [`WEAPON_THROWN_TOMAHAWK_ANCIENT`] = 'Thrown Tomahawk Ancient',
    [`WEAPON_MELEE_HATCHET_DOUBLE_BIT_RUSTED`] = 'Melee Hatchet Double Bit Rusted',
    [`WEAPON_THROWN_TOMAHAWK`] = 'Thrown Tomahawk',
    [`WEAPON_THROWN_DYNAMITE`] = 'Thrown Dynamite',
    [`WEAPON_MELEE_HATCHET_DOUBLE_BIT`] = 'Melee Hatchet Double Bit',
    [`WEAPON_THROWN_THROWING_KNIVES`] = 'Thrown Throwing Knives',
    [`WEAPON_MELEE_HATCHET_HUNTER_RUSTED`] = 'Melee Hatchet Hunter Rusted',
    [`WEAPON_MELEE_CLEAVER`] = 'Melee Cleaver',
    [`WEAPON_MELEE_LANTERN`] = 'Melee Lantern',
    [`WEAPON_MELEE_DAVY_LANTERN`] = 'Melee Davy Lantern',
    [`WEAPON_MELEE_LANTERN_ELECTRIC`] = 'Melee Lantern Electric',
    [`WEAPON_KIT_BINOCULARS`] = 'Kit Binoculars',
    [`WEAPON_KIT_CAMERA`] = 'Kit Camera',
    [`WEAPON_KIT_DETECTOR`] = 'Kit Detector',
    [`WEAPON_BOW_CHARLES`] = 'Bow Charles',
    [`WEAPON_BOW`] = 'Bow',
    [`WEAPON_FISHINGROD`] = 'Fishingrod',
    [`WEAPON_LASSO`] = 'Lasso',
    [`WEAPON_WOLF`] = 'Wolf',
    [`WEAPON_WOLF_MEDIUM`] = 'Wolf Medium',
    [`WEAPON_WOLF_SMALL`] = 'Wolf Small',
    [`WEAPON_ALLIGATOR`] = 'Alligator',
    [`WEAPON_ANIMAL`] = 'Animal',
    [`WEAPON_BADGER`] = 'Badger',
    [`WEAPON_BEAR`] = 'Bear',
    [`WEAPON_BEAVER`] = 'Beaver',
    [`WEAPON_COUGAR`] = 'Cougar',
    [`WEAPON_COYOTE`] = 'Coyote',
    [`WEAPON_DEER`] = 'Deer',
    [`WEAPON_FOX`] = 'Fox',
    [`WEAPON_HORSE`] = 'Horse',
    [`WEAPON_MUSKRAT`] = 'Muskrat',
    [`WEAPON_RACCOON`] = 'Raccoon',
    [`WEAPON_SNAKE`] = 'Snake',
    [`WEAPON_FALL`] = 'Fall',
    [`WEAPON_FIRE`] = 'Fire',
    [`WEAPON_BLEEDING`] = 'Bleeding',
    [`WEAPON_DROWNING`] = 'Drowning',
    [`WEAPON_DROWNING_IN_VEHICLE`] = 'Drowning In Vehicle',
    [`WEAPON_EXPLOSION`] = 'Explosion',
    [`WEAPON_RAMMED_BY_CAR`] = 'Rammed By Car',
    [`WEAPON_RUN_OVER_BY_CAR`] = 'Run Over By Car',

    --  Weapons from game version 1207.80 till 1311.1212
    [`WEAPON_KIT_CAMERA_ADVANCED`] = 'Kit Camera Advanced',
    [`WEAPON_MELEE_MACHETE_HORROR`] = 'Melee Machete Horror',
    [`WEAPON_BOW_IMPROVED`] = 'Bow Improved',
    [`WEAPON_RIFLE_ELEPHANT`] = 'Rifle Elephant',
    [`WEAPON_REVOLVER_NAVY`] = 'Revolver Navy',
    [`WEAPON_LASSO_REINFORCED`] = 'Lasso Reinforced',
    [`WEAPON_KIT_BINOCULARS_IMPROVED`] = 'Kit Binoculars Improved',
    [`WEAPON_MELEE_KNIFE_TRADER`] = 'Melee Knife Trader',
    [`WEAPON_MELEE_MACHETE_COLLECTOR`] = 'Melee Machete Collector',
    [`WEAPON_MOONSHINEJUG_MP`] = 'Moonshinejug Mp',
    [`WEAPON_THROWN_BOLAS`] = 'Thrown Bolas',
    [`WEAPON_THROWN_POISONBOTTLE`] = 'Thrown Poisonbottle',

    --  Weapons from game version 1311.12 till 1355.18
    [`WEAPON_KIT_METAL_DETECTOR`] = 'Kit Metal Detector',
    [`WEAPON_REVOLVER_NAVY_CROSSOVER`] = 'Revolver Navy Crossover',
    [`WEAPON_THROWN_BOLAS_HAWKMOTH`] = 'Thrown Bolas Hawkmoth',
    [`WEAPON_THROWN_BOLAS_IRONSPIKED`] = 'Thrown Bolas Ironspiked',
    [`WEAPON_THROWN_BOLAS_INTERTWINED`] = 'Thrown Bolas Intertwined',

    --  Weapons from game version 1355.18 till 1436.26
    [`WEAPON_MELEE_KNIFE_HORROR`] = 'Melee Knife Horror',
    [`WEAPON_MELEE_KNIFE_RUSTIC`] = 'Melee Knife Rustic',
    [`WEAPON_MELEE_LANTERN_HALLOWEEN`] = 'Melee Lantern Halloween',
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
