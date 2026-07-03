-- =============================================
--  This file handles the client-side jail (timeout) enforcement:
--  teleporting + freezing the ped, keeping it inside the jail,
--  and showing the countdown alert.
--  NOTE: must work with the menu disabled, so it only uses the
--  helpers from cl_functions.lua that are always available.
-- =============================================

local isJailed = false
local jailPos = nil
local jailRemaining = 0
local originalCoords = nil

--- Opens/updates the full-screen jail overlay in the NUI.
--- Only needs to be called on start and whenever the displayed minute
--- changes, since the NUI ticks the countdown down locally every second.
local function updateJailScreen(author, reason)
    sendMenuMessage('setJailOpen', {
        author = author,
        reason = reason,
        remainingSeconds = jailRemaining,
    })
end

local function enforceJailPosition()
    local playerPed = PlayerPedId()
    TaskLeaveAnyVehicle(playerPed, 0, 16)
    Wait(50)
    playerPed = PlayerPedId()
    SetEntityCoords(playerPed, jailPos.x, jailPos.y, jailPos.z, false, false, false, false)
    FreezeEntityPosition(playerPed, true)
end

--- Disables all control inputs (movement, combat, vehicles, weapon wheel, etc.)
--- every frame while jailed, so freezing alone can't be bypassed.
local function startInputBlockThread()
    CreateThread(function()
        while isJailed do
            DisableAllControlActions(0)
            DisableAllControlActions(1)
            DisableAllControlActions(2)
            DisablePlayerFiring(PlayerId(), true)
            Wait(0)
        end
    end)
end

RegisterNetEvent('txcl:jail:start', function(author, reason, remaining, pos)
    if type(remaining) ~= 'number' or type(pos) ~= 'table' then return end
    local wasJailed = isJailed
    isJailed = true
    jailPos = vector3(pos.x, pos.y, pos.z)
    jailRemaining = remaining

    -- save the original position to restore on release (first jail this session only)
    if not wasJailed then
        originalCoords = GetEntityCoords(PlayerPedId())
    end

    enforceJailPosition()
    updateJailScreen(author, reason)

    if wasJailed then return end --enforcement thread already running

    startInputBlockThread()

    CreateThread(function()
        local lastUpdateMinute = math.ceil(jailRemaining / 60)
        while isJailed do
            Wait(1000)
            if not isJailed then break end
            jailRemaining = jailRemaining - 1

            -- re-enforce position/freeze (death respawns recreate the ped)
            local playerPed = PlayerPedId()
            if not IsEntityDead(playerPed) then
                if #(GetEntityCoords(playerPed) - jailPos) > 10.0 then
                    enforceJailPosition()
                else
                    FreezeEntityPosition(playerPed, true) --idempotent, counters other scripts unfreezing
                end
            end

            SetEntityHealth(playerPed, GetEntityMaxHealth(playerPed))

            -- resync the NUI countdown when the displayed minute changes
            local currMinute = math.ceil(jailRemaining / 60)
            if currMinute ~= lastUpdateMinute then
                lastUpdateMinute = currMinute
                updateJailScreen(author, reason)
            end
        end
    end)
end)

RegisterNetEvent('txcl:jail:release', function()
    if not isJailed then return end
    isJailed = false
    jailPos = nil

    local playerPed = PlayerPedId()
    FreezeEntityPosition(playerPed, false)
    if originalCoords ~= nil then
        SetEntityCoords(playerPed, originalCoords.x, originalCoords.y, originalCoords.z, false, false, false, false)
        originalCoords = nil
    end

    sendMenuMessage('closeJail', {})
    sendSnackbarMessage('info', 'nui_menu.jail.released', true)
end)
