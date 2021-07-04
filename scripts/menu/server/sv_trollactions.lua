RegisterNetEvent('txAdmin:menu:weedEffectPlayer', function(id)
    local src = source
    local allow = PlayerHasTxPermission(src, 'players.troll')
    local playerName
    if allow then
        TriggerClientEvent('txAdmin:menu:weedEffect', id)
        playerName = GetPlayerName(id) or "unknown"
    end
    TriggerEvent('txaLogger:menuEvent', src, 'weedEffect', allow, playerName)
end)

RegisterNetEvent('txAdmin:menu:drunkEffectPlayer', function(id)
    local src = source
    local allow = PlayerHasTxPermission(src, 'players.troll')
    local playerName
    if allow then
        TriggerClientEvent('txAdmin:menu:drunkEffect', id)
        playerName = GetPlayerName(id) or "unknown"
    end
    TriggerEvent('txaLogger:menuEvent', src, 'drunkEffect', allow, playerName)
end)

RegisterNetEvent('txAdmin:menu:wildAttack', function(id)
    local src = source
    local allow = PlayerHasTxPermission(src, 'players.troll')
    local playerName
    if allow then
        TriggerClientEvent('txAdmin:menu:wildAttack', id)
        playerName = GetPlayerName(id) or "unknown"
    end
    TriggerEvent('txaLogger:menuEvent', src, 'wildAttack', allow, playerName)
end)

RegisterNetEvent('txAdmin:menu:setOnFire', function(id)
    local src = source
    local allow = PlayerHasTxPermission(src, 'players.troll')
    local playerName
    if allow then
        TriggerClientEvent('txAdmin:menu:setOnFire', id)
        playerName = GetPlayerName(id) or "unknown"
    end
    TriggerEvent('txaLogger:menuEvent', src, 'setOnFire', allow, playerName)
end)
