local floor = math.floor
local vector3 = vector3
local SetCamRot = SetCamRot
local IsCamActive = IsCamActive
local SetCamCoord = SetCamCoord
local LoadInterior = LoadInterior
local SetFocusArea = SetFocusArea
local LockMinimapAngle = LockMinimapAngle
local GetInteriorAtCoords = GetInteriorAtCoords
local LockMinimapPosition = LockMinimapPosition

local _internal_camera = nil
local _internal_isFrozen = false

local _internal_pos = nil
local _internal_rot = nil
local _internal_fov = nil
local _internal_vecX = nil
local _internal_vecY = nil
local _internal_vecZ = nil

--------------------------------------------------------------------------------

function GetInitialCameraPosition()
  if _G.CAMERA_SETTINGS.KEEP_POSITION and _internal_pos then
    return _internal_pos
  end

  return GetGameplayCamCoord()
end

function GetInitialCameraRotation()
  if _G.CAMERA_SETTINGS.KEEP_ROTATION and _internal_rot then
    return _internal_rot
  end

  local rot = GetGameplayCamRot()
  return vector3(rot.x, 0.0, rot.z)
end

--------------------------------------------------------------------------------

function IsFreecamFrozen()
  return _internal_isFrozen
end

function SetFreecamFrozen(frozen)
  local frozen = frozen == true
  _internal_isFrozen = frozen
end

--------------------------------------------------------------------------------

function GetFreecamPosition()
  return _internal_pos
end

function SetFreecamPosition(x, y, z)
  local pos = vector3(x, y, z)
  local int = GetInteriorAtCoords(pos)

  LoadInterior(int)
  SetFocusArea(pos)
  LockMinimapPosition(x, y)
  SetCamCoord(_internal_camera, pos)

  _internal_pos = pos
end

--------------------------------------------------------------------------------

function GetFreecamRotation()
  return _internal_rot
end


function SetFreecamRotation(x, y, z)
  local rotX, rotY, rotZ = ClampCameraRotation(x, y, z)
  local vecX, vecY, vecZ = EulerToMatrix(rotX, rotY, rotZ)
  local rot = vector3(rotX, rotY, rotZ)

  LockMinimapAngle(floor(rotZ))
  SetCamRot(_internal_camera, rot)

  _internal_rot  = rot
  _internal_vecX = vecX
  _internal_vecY = vecY
  _internal_vecZ = vecZ
end

--------------------------------------------------------------------------------

function GetFreecamFov()
  return _internal_fov
end

function SetFreecamFov(fov)
  local fov = Clamp(fov, 0.0, 90.0)
  SetCamFov(_internal_camera, fov)
  _internal_fov = fov
end

--------------------------------------------------------------------------------

function GetFreecamMatrix()
  return _internal_vecX,
         _internal_vecY,
         _internal_vecZ,
         _internal_pos
end

function GetFreecamTarget(distance)
  local target = _internal_pos + (_internal_vecY * distance)
  return target
end

--------------------------------------------------------------------------------

function IsFreecamActive()
  return IsCamActive(_internal_camera) == 1
end

function SetFreecamActive(active)
  if active == IsFreecamActive() then
    return
  end

  local enableEasing = _G.CAMERA_SETTINGS.ENABLE_EASING
  local easingDuration = _G.CAMERA_SETTINGS.EASING_DURATION

  if active then
    local pos = GetInitialCameraPosition()
    local rot = GetInitialCameraRotation()

    _internal_camera = CreateCam('DEFAULT_SCRIPTED_CAMERA', true)

    SetFreecamFov(_G.CAMERA_SETTINGS.FOV)
    SetFreecamPosition(pos.x, pos.y, pos.z)
    SetFreecamRotation(rot.x, rot.y, rot.z)
    TriggerEvent('freecam:onEnter')
  else
    DestroyCam(_internal_camera)
    ClearFocus()
    UnlockMinimapPosition()
    UnlockMinimapAngle()
    TriggerEvent('freecam:onExit')
  end

  RenderScriptCams(active, enableEasing, easingDuration, true, true)
end
