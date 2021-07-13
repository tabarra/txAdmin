-- ===============
--  This file contains functionality purely related
--  to player modes (noclip, godmode)
-- ===============

if (GetConvar('txEnableMenuBeta', 'false') ~= 'true') then
    return
end

local noClipEnabled = false

local function toggleGodMode(enabled)
    if enabled then
        sendPersistentAlert('godModeEnabled', 'info', 'nui_menu.page_main.player_mode.dialog_success_godmode', true)
    else
        clearPersistentAlert('godModeEnabled')
    end
    SetEntityInvincible(PlayerPedId(), enabled)
end

local freecamVeh = 0
local function toggleFreecam(enabled)
    noClipEnabled = enabled
    local ped = PlayerPedId()
    SetEntityVisible(ped, not enabled)
    SetPlayerInvincible(ped, enabled)
    FreezeEntityPosition(ped, enabled)

    if enabled then
        freecamVeh = GetVehiclePedIsIn(ped, false)
        if freecamVeh > 0 then
            NetworkSetEntityInvisibleToNetwork(freecamVeh, true)
            SetEntityCollision(freecamVeh, false, false)
        end
    end

    local function enableNoClip()
        lastTpCoords = GetEntityCoords(ped)

        SetFreecamActive(true)
        StartFreecamThread()

        Citizen.CreateThread(function()
            while IsFreecamActive() do
                SetEntityLocallyInvisible(ped)
                if freecamVeh > 0 then
                    if DoesEntityExist(freecamVeh) then
                        SetEntityLocallyInvisible(freecamVeh)
                    else
                        freecamVeh = 0
                    end
                end
                Wait(0)
            end

            if not DoesEntityExist(freecamVeh) then
                freecamVeh = 0
            end
            if freecamVeh > 0 then
                local coords = GetEntityCoords(ped)
                NetworkSetEntityInvisibleToNetwork(freecamVeh, false)
                SetEntityCollision(freecamVeh, true, true)
                SetEntityCoords(freecamVeh, coords[1], coords[2], coords[3])
                SetPedIntoVehicle(ped, freecamVeh, -1)
                freecamVeh = 0
            end
        end)
    end

    local function disableNoClip()
        SetFreecamActive(false)
        SetGameplayCamRelativeHeading(0)
    end

    if not IsFreecamActive() and enabled then
        sendPersistentAlert('noClipEnabled', 'info', 'nui_menu.page_main.player_mode.dialog_success_noclip', true)
        enableNoClip()
    end

    if IsFreecamActive() and not enabled then
        clearPersistentAlert('noClipEnabled')
        disableNoClip()
    end
end

RegisterKeyMapping('txAdmin:menu:noClipToggle', 'NoClip Shortcut', 'keyboard', '')

RegisterCommand('txAdmin:menu:noClipToggle', function()
    local doesPlayerHavePerm = DoesPlayerHavePerm(menuPermissions, 'players.playermode')
    if not doesPlayerHavePerm then
        return sendSnackbarMessage('error', 'nui_menu.misc.general_no_perms', true)
    end

    debugPrint("NoClip toggled:" .. tostring(not noClipEnabled))

    -- Toggling behavior
    if noClipEnabled then
        TriggerServerEvent('txAdmin:menu:playerModeChanged', "none")
    else
        TriggerServerEvent('txAdmin:menu:playerModeChanged', "noclip")
    end
end)

-- This will trigger everytime the playerMode in the main menu is changed
-- it will send the mode
RegisterNUICallback('playerModeChanged', function(mode, cb)
    debugPrint("player mode requested: " .. (mode or 'nil'))
    TriggerServerEvent('txAdmin:menu:playerModeChanged', mode)
    cb({})
end)

-- [[ Player mode changed cb event ]]
RegisterNetEvent('txAdmin:menu:playerModeChanged', function(mode)
    if mode == 'godmode' then
        toggleFreecam(false)
        toggleGodMode(true)
    elseif mode == 'noclip' then
        toggleGodMode(false)
        toggleFreecam(true)
    elseif mode == 'none' then
        toggleFreecam(false)
        toggleGodMode(false)
    end
end)

