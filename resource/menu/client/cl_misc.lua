-- Prevent running if menu is disabled
if not TX_MENU_ENABLED then return end

-- =============================================
--  This file contains misc stuff, maybe deprecate?
-- =============================================

-- Consts
local soundLibrary
if IS_FIVEM then
    soundLibrary = {
        move = {'NAV_UP_DOWN', 'HUD_FRONTEND_DEFAULT_SOUNDSET'},
        enter = {'SELECT', 'HUD_FRONTEND_DEFAULT_SOUNDSET'},
        confirm = {'CONFIRM_BEEP', 'HUD_MINI_GAME_SOUNDSET'},
    }
else
    soundLibrary = {
        move = {'round_start_countdown_tick', 'RDRO_Poker_Sounds'},
        enter = {'BET_PROMPT', 'HUD_POKER'},
        confirm = {'BULLSEYE', 'FMA_ARCHERY_Sounds'},
    }
end

function playLibrarySound(sound)
    if IS_FIVEM then
        PlaySoundFrontend(-1, soundLibrary[sound][1], soundLibrary[sound][2], 1)
    else
        Citizen.InvokeNative(0x9D746964E0CF2C5F, soundLibrary[sound][1], soundLibrary[sound][2])  -- ReleaseShardSounds
        Wait(0)
        PlaySoundFrontend(soundLibrary[sound][1], soundLibrary[sound][2], true, 1);
    end
end

-- Audio play callback
RegisterNUICallback('playSound', function(sound, cb)
    playLibrarySound(sound)
    cb({})
end)

-- Heals local player
RegisterNetEvent('txAdmin:menu:healed', function()
    debugPrint('Received heal event, healing to full')
    local ped = PlayerPedId()
    local pos = GetEntityCoords(ped)
    local heading = GetEntityHeading(ped)
    if IsEntityDead(ped) then
        NetworkResurrectLocalPlayer(pos[1], pos[2], pos[3], heading, false, false)
    end
    ResurrectPed(ped)
    SetEntityHealth(ped, GetEntityMaxHealth(ped))
    ClearPedBloodDamage(ped)
    RestorePlayerStamina(PlayerId(), 100.0)
    if IS_REDM then
        Citizen.InvokeNative(0xC6258F41D86676E0, ped, 0, 100) -- SetAttributeCoreValue
        Citizen.InvokeNative(0xC6258F41D86676E0, ped, 1, 100) -- SetAttributeCoreValue
        Citizen.InvokeNative(0xC6258F41D86676E0, ped, 2, 100) -- SetAttributeCoreValue
    end
end)

-- Tell the user he is an admin and that /tx is available
AddEventHandler('playerSpawned', function()
    Wait(15000)
    if menuIsAccessible then
        sendMenuMessage('showMenuHelpInfo', {})
    end
end)
