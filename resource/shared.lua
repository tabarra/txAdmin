-- =============================================
--  Truly global
-- =============================================

function GetConvarBool(cvName)
  return (GetConvar(cvName, 'false') == 'true')
end

-- Setting game-specific global vars
local envName = GetGameName()
if envName == 'fxserver' then
  local gameConvar = GetConvar('gamename', 'gta5')
  GAME_NAME = gameConvar == 'gta5' and 'fivem' or 'redm'
else
  GAME_NAME = envName
end
IS_FIVEM = GAME_NAME == 'fivem'
IS_REDM = GAME_NAME == 'redm'

-- Setting global enable/disable variable for all sv_*.lua files
-- NOTE: not available on client
TX_SERVER_MODE = GetConvarBool('txAdminServerMode')

-- Setting global enable/disable variable for all menu-related files
TX_MENU_ENABLED = GetConvarBool('txAdmin-menuEnabled')

-- Setting global debug variable for all files
-- On the client, this is updated by receiving a `txcl:setDebugMode` event.
-- On the server, this is updated by running txaSetDebugMode on Live Console
TX_DEBUG_MODE = GetConvarBool('txAdmin-debugMode')


--- Prints formatted string to console
function txPrint(...)
  local args = {...}
  local appendedStr = ''
  for _, v in ipairs(args) do
    appendedStr = appendedStr .. ' ' .. (type(v)=="table" and json.encode(v) or tostring(v))
  end
  local msgTemplate = '^5[txAdmin]^0%s^0'
  local msg = msgTemplate:format(appendedStr)
  print(msg)
end

--- Prints formatted string to console if debug mode is enabled
function debugPrint(...)
  if TX_DEBUG_MODE then
    txPrint(...)
  end
end


--- Finds the index of a table element
---@param tgtTable table
---@param value any
---@return integer
function tableIndexOf(tgtTable, value)
  for i=1, #tgtTable do
    debugPrint(('tgtTableVal: %s, value: %s'):format(tgtTable[i], value))
    if tgtTable[i] == value then
      return i
    end
  end
  return -1
end


---Shortcut for calculating a ped % health
---@param ped any
---@return integer
function GetPedHealthPercent(ped)
  return math.floor((GetEntityHealth(ped) / GetEntityMaxHealth(ped)) * 100)
end
