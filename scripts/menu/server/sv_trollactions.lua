RegisterServerEvent('txAdmin:menu:weedEffectPlayer', function(id)
    local src = source
    local allow = PlayerHasTxPermission(src, 'players.troll')
    if allow then
        TriggerClientEvent('txAdmin:menu:weedEffect', id)
    end
    TriggerEvent('txaLogger:menuEvent', src, 'weedEffect', allow, id)
end)

RegisterServerEvent('txAdmin:menu:drunkEffectPlayer', function(id)
    local src = source
    local allow = PlayerHasTxPermission(src, 'players.troll')
    if allow then
        TriggerClientEvent('txAdmin:menu:drunkEffect', id)
    end
    TriggerEvent('txaLogger:menuEvent', src, 'drunkEffect', allow, id)
end)

RegisterServerEvent('txAdmin:menu:wildAttack', function(id)
    local src = source
    local allow = PlayerHasTxPermission(src, 'players.troll')
    if allow then
        TriggerClientEvent('txAdmin:menu:wildAttack', id)
    end
    TriggerEvent('txaLogger:menuEvent', src, 'wildAttack', allow, id)
end)

RegisterServerEvent('txAdmin:menu:setOnFire', function(id)
    local src = source
    local allow = PlayerHasTxPermission(src, 'players.troll')
    if allow then
        TriggerClientEvent('txAdmin:menu:setOnFire', id)
    end
    TriggerEvent('txaLogger:menuEvent', src, 'setOnFire', allow, id)
end)