-- =============================================
--  This file contains mainly all player events like
--  heal or announce, as well as some global constants. Also contains some
--  misc functionality.
-- =============================================

--[[ Constants ]]

SoundEnum = {
    move = 'NAV_UP_DOWN',
    enter = 'SELECT'
}

RegisterNetEvent('txAdmin:receiveAnnounce', function(message)
    sendMenuMessage('addAnnounceMessage', { message = message })
end)

if (GetConvar('txEnableMenuBeta', 'false') ~= 'true') then
    return
end

RegisterNetEvent('txAdmin:menu:healed', function()
    debugPrint('Received heal event, healing to full')
    local ped = PlayerPedId()
    local pos = GetEntityCoords(ped)
    local heading = GetEntityHeading(ped)
    if IsEntityDead(ped) then
        NetworkResurrectLocalPlayer(pos[1], pos[2], pos[3], heading, false, false)
    end
    ped = PlayerPedId()
    SetEntityHealth(ped, GetEntityMaxHealth(ped))
end)

-- Used to trigger the help alert
AddEventHandler('playerSpawned', function()
    Wait(60000)
    if menuIsAccessible then
        sendMenuMessage('showMenuHelpInfo', {})
    end
end)