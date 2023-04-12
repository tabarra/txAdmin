local CTRL_MOUSE_LR, CTRL_MOUSE_UD, CTRL_SLOW, CTRL_FAST, CTRL_FRONT_BACK, CTRL_LEFT_RIGHT, CTRL_GO_UP, CTRL_GO_DOWN, CTRL_RIGHT_TRIGGER, CTRL_LEFT_TRIGGER

if IS_FIVEM then
  CTRL_MOUSE_LR = 1               -- INPUT_LOOK_LR
  CTRL_MOUSE_UD = 2               -- INPUT_LOOK_UD
  CTRL_SLOW = 19                  -- INPUT_CHARACTER_WHEEL
  CTRL_FAST = 21                  -- INPUT_SPRINT
  CTRL_GO_UP = 152                -- INPUT_PARACHUTE_BRAKE_LEFT
  CTRL_GO_DOWN = 153              -- INPUT_PARACHUTE_BRAKE_RIGHT
  CTRL_FRONT_BACK = 31            -- INPUT_MOVE_UD
  CTRL_LEFT_RIGHT = 30            -- INPUT_MOVE_LR

  CTRL_RIGHT_TRIGGER = 71         -- INPUT_VEH_ACCELERATE
  CTRL_LEFT_TRIGGER = 72          -- INPUT_VEH_BRAKE
else
  CTRL_MOUSE_LR = 0xA987235F      -- INPUT_LOOK_LR
  CTRL_MOUSE_UD = 0xD2047988      -- INPUT_LOOK_UD
  CTRL_SLOW = 0x580C4473          -- INPUT_HUD_SPECIAL
  CTRL_FAST = 0x8FFC75D6          -- INPUT_SPRINT
  CTRL_GO_UP = 0x06052D11         -- INPUT_DIVE
  CTRL_GO_DOWN = 0xD51B784F       -- INPUT_CONTEXT_Y
  CTRL_FRONT_BACK = 0xFDA83190    -- INPUT_MOVE_UD
  CTRL_LEFT_RIGHT = 0x4D8FB4C1    -- INPUT_MOVE_LR

  CTRL_RIGHT_TRIGGER = 0x5B9FD4E2 -- INPUT_VEH_ACCELERATE
  CTRL_LEFT_TRIGGER = 0x6E1F639B  -- INPUT_VEH_BRAKE
end

--------------------------------------------------------------------------------

local BASE_CONTROL_MAPPING = protect({
  -- Rotation
  LOOK_X = CTRL_MOUSE_LR,
  LOOK_Y = CTRL_MOUSE_UD,

  -- Position
  MOVE_X = CTRL_LEFT_RIGHT,
  MOVE_Y = CTRL_FRONT_BACK,
  MOVE_Z = { CTRL_GO_UP, CTRL_GO_DOWN },

  -- Multiplier
  MOVE_FAST = CTRL_FAST,
  MOVE_SLOW = CTRL_SLOW
})

--------------------------------------------------------------------------------

local BASE_CONTROL_SETTINGS = protect({
  -- Rotation
  LOOK_SENSITIVITY_X = 5,
  LOOK_SENSITIVITY_Y = 5,

  -- Position
  BASE_MOVE_MULTIPLIER = 0.85,
  FAST_MOVE_MULTIPLIER = 6,
  SLOW_MOVE_MULTIPLIER = 6,
})

--------------------------------------------------------------------------------

local BASE_CAMERA_SETTINGS = protect({
  --Camera
  FOV = 50.0,

  -- On enable/disable
  ENABLE_EASING = true,
  EASING_DURATION = 250,

  -- Keep position/rotation
  KEEP_POSITION = false,
  KEEP_ROTATION = false
})

--------------------------------------------------------------------------------

_G.KEYBOARD_CONTROL_MAPPING = table.copy(BASE_CONTROL_MAPPING)
_G.GAMEPAD_CONTROL_MAPPING = table.copy(BASE_CONTROL_MAPPING)

-- Swap up/down movement (LB for down, RB for up)
_G.GAMEPAD_CONTROL_MAPPING.MOVE_Z[1] = CTRL_GO_UP
_G.GAMEPAD_CONTROL_MAPPING.MOVE_Z[2] = CTRL_GO_DOWN

-- Use LT and RT for speed
_G.GAMEPAD_CONTROL_MAPPING.MOVE_FAST = CTRL_RIGHT_TRIGGER
_G.GAMEPAD_CONTROL_MAPPING.MOVE_SLOW = CTRL_LEFT_TRIGGER

protect(_G.KEYBOARD_CONTROL_MAPPING)
protect(_G.GAMEPAD_CONTROL_MAPPING)

--------------------------------------------------------------------------------

_G.KEYBOARD_CONTROL_SETTINGS = table.copy(BASE_CONTROL_SETTINGS)
_G.GAMEPAD_CONTROL_SETTINGS = table.copy(BASE_CONTROL_SETTINGS)

-- Gamepad sensitivity can be reduced by BASE.
_G.GAMEPAD_CONTROL_SETTINGS.LOOK_SENSITIVITY_X = 2
_G.GAMEPAD_CONTROL_SETTINGS.LOOK_SENSITIVITY_Y = 2

protect(_G.KEYBOARD_CONTROL_SETTINGS)
protect(_G.GAMEPAD_CONTROL_SETTINGS)

--------------------------------------------------------------------------------

_G.CAMERA_SETTINGS = table.copy(BASE_CAMERA_SETTINGS)
protect(_G.CAMERA_SETTINGS)

--------------------------------------------------------------------------------

-- Create some convenient variables.
-- Allows us to access controls and config without a gamepad switch.
_G.CONTROL_MAPPING  = CreateGamepadMetatable(_G.KEYBOARD_CONTROL_MAPPING,  _G.GAMEPAD_CONTROL_MAPPING)
_G.CONTROL_SETTINGS = CreateGamepadMetatable(_G.KEYBOARD_CONTROL_SETTINGS, _G.GAMEPAD_CONTROL_SETTINGS)
