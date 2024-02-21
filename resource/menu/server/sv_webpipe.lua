-- Prevent running in monitor mode
if not TX_SERVER_MODE then return end
-- Prevent running if menu is disabled
if not TX_MENU_ENABLED then return end

if TX_LUACOMHOST == "invalid" or TX_LUACOMTOKEN == "invalid" then
  log('^1API Host or Pipe Token ConVars not found. Do not start this resource if not using txAdmin.')
  return
end
if TX_LUACOMTOKEN == "removed" then
  log('^1Please do not restart the monitor resource.')
  return
end


-- =============================================
--  This file is responsible for all the webpipe
--  handling and caching.
-- =============================================

local _pipeLastReject
local _pipeFastCache = {}

---@param src string
---@param callbackId number
---@param statusCode number
---@param path string
---@param body string
---@param headers table
---@param cached boolean|nil
local function sendResponse(src, callbackId, statusCode, path, body, headers, cached)
  local errorCode = tonumber(statusCode) >= 400
  local resultColor = errorCode and '^1' or '^2'
  local cachedStr = cached and " ^1(cached)^0" or ""
  debugPrint(("^3WebPipe[^5%d^0:^1%d^3]^0 %s<< %s ^4%s%s^0"):format(
    src, callbackId, resultColor, statusCode, path, cachedStr))
  if errorCode then
    debugPrint(("^3WebPipe[^5%d^0:^1%d^3]^0 %s<< Headers: %s^0"):format(
      src, callbackId, resultColor, json.encode(headers)))
  end
  TriggerLatentClientEvent('txcl:webpipe:resp', src, 125000, callbackId, statusCode, body, headers)
end

RegisterNetEvent('txsv:webpipe:req', function(callbackId, method, path, headers, body)
  local s = source
  local src = tostring(s)
  if type(callbackId) ~= 'number' or type(headers) ~= 'table' then
    return
  end
  if type(method) ~= 'string' or type(path) ~= 'string' or type(body) ~= 'string' then
    return
  end

  -- Reject large paths as we use regex
  if #path > 500 then
    return sendResponse(s, callbackId, 400, path:sub(1, 300), "{}", {})
  end

  -- Treat path slashes
  local url = "http://" .. (TX_LUACOMHOST .. '/' .. path):gsub("//+", "/")

  -- Reject requests from un-authed players
  if not TX_ADMINS[src] then
    if _pipeLastReject ~= nil then
      if (GetGameTimer() - _pipeLastReject) < 250 then
        _pipeLastReject = GetGameTimer()
        return
      end
    end
    debugPrint(string.format(
        "^3WebPipe[^5%d^0:^1%d^3]^0 ^1rejected request from ^3%s^1 for ^5%s^0", s, callbackId, s, path))
    TriggerClientEvent('txcl:webpipe:resp', s, callbackId, 403, "{}", {})
    return
  end

  -- Return fast cache
  if _pipeFastCache[path] ~= nil then
    local cachedData = _pipeFastCache[path]
    sendResponse(s, callbackId, 200, path, cachedData.data, cachedData.headers, true)
    return
  end

  -- Adding admin identifiers for auth middleware to deal with
  headers['X-TxAdmin-Token'] = TX_LUACOMTOKEN
  headers['X-TxAdmin-Identifiers'] = table.concat(GetPlayerIdentifiers(s), ',')

  
  debugPrint(("^3WebPipe[^5%d^0:^1%d^3]^0 ^4>>^0 ^6%s^0"):format(s, callbackId, url))
  debugPrint(("^3WebPipe[^5%d^0:^1%d^3]^0 ^4>>^0 ^6Headers: %s^0"):format(s, callbackId, json.encode(headers)))

  PerformHttpRequest(url, function(httpCode, data, resultHeaders)
    -- fixing body for error pages (eg 404)
    -- this is likely because of how json.encode() interprets null and an empty table
    data = data or ''
    resultHeaders['x-badcast-fix'] = 'https://youtu.be/LDU_Txk06tM' -- fixed in artifact v3996

    -- fixing redirects
    if resultHeaders.Location then
      if resultHeaders.Location:sub(1, 1) == '/' then
        resultHeaders.Location = '/WebPipe' .. resultHeaders.Location
      end
    end

    -- fixing cookies
    if resultHeaders['Set-Cookie'] then
      local cookieHeader = resultHeaders['Set-Cookie']
      local cookies = type(cookieHeader) == 'table' and cookieHeader or { cookieHeader }

      for k in pairs(cookies) do
        cookies[k] = cookies[k] .. '; SameSite=None; Secure'
      end

      resultHeaders['Set-Cookie'] = cookies
    end

    -- cache response if it is a static file
    local sub = string.sub
    if 
      httpCode == 200 and 
      (
        sub(path, 1, 5) == '/css/' or 
        sub(path, 1, 4) == '/js/' or 
        sub(path, 1, 5) == '/img/' or 
        sub(path, 1, 7) == '/fonts/'
      ) 
    then
      -- remove query params from path, so people can't consume memory by spamming cache-busters
      for safePath in path:gmatch("([^?]+)") do
        local slimHeaders = {}
        for k, v in pairs(resultHeaders) do
          if k ~= 'Set-Cookie' then
            slimHeaders[k] = v
          end
        end
        _pipeFastCache[safePath] = { data = data, headers = slimHeaders }
        debugPrint(("^3WebPipe[^5%d^0:^1%d^3]^0 ^5cached ^4%s^0"):format(s, callbackId, safePath))
        break
      end
    end

    sendResponse(s, callbackId, httpCode, path, data, resultHeaders)
  end, method, body, headers, {followLocation = false})
end)
