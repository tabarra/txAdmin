-- Prevent running in monitor mode
if not TX_SERVER_MODE then return end
-- Prevent running if menu is disabled
if not TX_MENU_ENABLED then return end

RegisterNetEvent('txAdmin:menu:drunkEffectPlayer', function(id)
    local src = source
    local allow = PlayerHasTxPermission(src, 'players.troll')
    if allow then
        TriggerClientEvent('txAdmin:menu:drunkEffect', id)
    end
    TriggerEvent('txaLogger:menuEvent', src, 'drunkEffect', allow, id)
end)

RegisterNetEvent('txAdmin:menu:setOnFire', function(id)
    local src = source
    local allow = PlayerHasTxPermission(src, 'players.troll')
    if allow then
        TriggerClientEvent('txAdmin:menu:setOnFire', id)
    end
    TriggerEvent('txaLogger:menuEvent', src, 'setOnFire', allow, id)
end)

RegisterNetEvent('txAdmin:menu:wildAttack', function(id)
    local src = source
    local allow = PlayerHasTxPermission(src, 'players.troll')
    if allow then
        TriggerClientEvent('txAdmin:menu:wildAttack', id)
    end
    TriggerEvent('txaLogger:menuEvent', src, 'wildAttack', allow, id)
end)
