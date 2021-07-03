-- =============================================
--  This file contains players page functionality
-- =============================================

if (GetConvar('txEnableMenuBeta', 'false') ~= 'true') then
    return
end

--[[ Player list sync ]]
local posCache = {}
local vehCache = {}
RegisterNetEvent('txAdmin:menu:setPlayerState', function(data)
    -- print(json.encode(data))
    local NetToVeh = NetToVeh
    local GetVehicleClass = GetVehicleClass

    if type(data) ~= 'table' then
        print("^1Invalid player state data provided (was type: " .. type(data) .. ")")
        return
    end

    -- process data to add distance, remove pos
    local pedCoords = GetEntityCoords(PlayerPedId())
    local fullData = {}
    for _, row in pairs(data) do
        local serverId = row.i
        if type(row.c) == 'vector3' or type(row.c) == 'number' then posCache[serverId] = row.c end
        if type(row.v) == 'number' then vehCache[serverId] = row.v end
        local pos = posCache[serverId]
        local veh = vehCache[serverId]
        local dist
        if pos ~= nil and pos ~= -1 and type(pos) == 'vector3' then
            local targetVec = vec3(pos[1], pos[2], pos[3])
            dist = #(pedCoords - targetVec)
        else
            dist = -1
        end

        -- calculate the vehicle status
        local vehicleStatus = 'walking'
        if veh and veh > 0 then
            local vehEntity = NetToVeh(veh)
            if not vehEntity or vehEntity == 0 then
                vehicleStatus = 'unknown'
            else
                local vehClass = GetVehicleClass(vehEntity)
                if vehClass == 8 then
                    vehicleStatus = 'biking'
                elseif vehClass == 14 then
                    vehicleStatus = 'boating'
                    --elseif vehClass == 15 then
                    --  vehicleStatus = 'floating'
                    --elseif vehClass == 16 then
                    --  vehicleStatus = 'flying'
                else
                    vehicleStatus = 'driving'
                end
            end
        end

        fullData[#fullData + 1] = {
            id = tonumber(row.i),
            health = row.h,
            vehicleStatus = vehicleStatus,
            distance = dist,
            username = row.u,
            license = row.l
        }
    end

    debugPrint(("^2received ^3%d^2 players from state event"):format(#fullData))

    SendNUIMessage({
        action = 'setPlayerState',
        data = fullData
    })
end)
