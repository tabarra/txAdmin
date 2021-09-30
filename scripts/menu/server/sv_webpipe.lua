if GetConvar('txAdminServerMode', 'false') ~= 'true' then
  return
end

local apiHost = GetConvar("txAdmin-apiHost", "invalid")
local pipeToken = GetConvar("txAdmin-pipeToken", "invalid")

if apiHost == "invalid" or pipeToken == "invalid" then
  print('^1API Host or Pipe Token ConVars not found. Do not start this resource if not using txAdmin.')
  return
end

if pipeToken == "removed" then
  print('^1Please do not restart the monitor resource.')
  return
end

-- Erasing the token convar for security reasons, and then restoring it if debug mode.
-- The convar needs to be reset on first tick to prevent other resources from reading it.
-- We actually need to wait two frames: one for convar replication, one for debugPrint.
SetConvar("txAdmin-pipeToken", "removed")
CreateThread(function()
  Wait(0)
  if debugModeEnabled then
    debugPrint("Restoring txAdmin-pipeToken for next monitor restart")
    SetConvar("txAdmin-pipeToken", pipeToken)
  end
end)
--
-- [[ WebPipe Proxy ]]
--
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
  TriggerLatentClientEvent('txAdmin:WebPipe', src, 125000, callbackId, statusCode, body, headers)
end

RegisterNetEvent('txAdmin:WebPipe', function(callbackId, method, path, headers, body)
  local s = source
  local src = tostring(s)
  if type(callbackId) ~= 'number' or type(headers) ~= 'table' then
    return
  end
  if type(method) ~= 'string' or type(path) ~= 'string' or type(body) ~= 'string' then
    return
  end

  -- Reject large paths as we use regex
  if #path > 300 then
    return sendResponse(s, callbackId, 400, (path):sub(1, 300), "{}", {})
  end

  -- Reject requests from un-authed players
  if path ~= '/auth/nui' and not ADMIN_DATA[src] then
    if _pipeLastReject ~= nil then
      if (GetGameTimer() - _pipeLastReject) < 250 then
        _pipeLastReject = GetGameTimer()
        return
      end
    end
    debugPrint(string.format(
        "^3WebPipe[^5%d^0:^1%d^3]^0 ^1rejected request from ^3%s^1 for ^5%s^0", s, callbackId, s, path))
    TriggerClientEvent('txAdmin:WebPipe', s, callbackId, 403, "{}", {})
    return
  end

  -- Return fast cache
  if _pipeFastCache[path] ~= nil then
    local cachedData = _pipeFastCache[path]
    sendResponse(s, callbackId, 200, path, cachedData.data, cachedData.headers, true)
    return
  end

  -- Adding auth information
  if path == '/auth/nui' then
    headers['X-TxAdmin-Token'] = pipeToken
    headers['X-TxAdmin-Identifiers'] = table.concat(GetPlayerIdentifiers(s), ', ')
  else
    headers['X-TxAdmin-Token'] = 'not_required' -- so it's easy to detect webpipes
  end

  local url = "http://" .. apiHost .. path:gsub("//", "/")
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

    -- Sniff permissions out of the auth request
    if path == '/auth/nui' and httpCode == 200 then
      local resp = json.decode(data)
      if resp and resp.isAdmin then
        if type(resp.permissions) == 'table' and type(resp.luaToken) == 'string' and string.len(resp.luaToken) == 20 then
          debugPrint(("Authenticated admin %s with permissions %s and token %s."):format(src, json.encode(resp.permissions), resp.luaToken))
          ADMIN_DATA[src] = {
            perms = resp.permissions,
            token = resp.luaToken,
            bucket = 0
          }
          sendFullClientData(s)
        else
          debugPrint("Auth failed for admin %s due to response validation.")
          ADMIN_DATA[src] = nil
        end
      else
        ADMIN_DATA[src] = nil
      end
    end

    -- cache response if it is a static file
    local sub = string.sub
    if httpCode == 200 and (sub(path, 1, 5) == '/css/' or sub(path, 1, 4) == '/js/' or sub(path, 1, 5) == '/img/' or sub(path, 1, 7) == '/fonts/') then
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
  end, method, body, headers, {
    followLocation = false
  })
end)