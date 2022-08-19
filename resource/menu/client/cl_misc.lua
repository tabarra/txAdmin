-- =============================================
--  This file contains misc stuff, maybe deprecate?
-- =============================================
if (GetConvar('txAdmin-menuEnabled', 'false') ~= 'true') then
    return
end

-- Consts
SoundEnum = {
    move = 'NAV_UP_DOWN',
    enter = 'SELECT'
}

-- Audio play callback
RegisterNUICallback('playSound', function(sound, cb)
    PlaySoundFrontend(-1, SoundEnum[sound], 'HUD_FRONTEND_DEFAULT_SOUNDSET', 1)
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
    SetEntityHealth(ped, GetEntityMaxHealth(ped))
end)

-- Tell the user he is an admin and that /tx is available
AddEventHandler('playerSpawned', function()
    Wait(15000)
    if menuIsAccessible then
        sendMenuMessage('showMenuHelpInfo', {})
    end
end)
