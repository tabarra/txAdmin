-- Announce Scaleform to every players
local announce_title = "Staff announce"  -- Set the title of the announcement here.
local AnnouncementScaleform
Scaleform = {}
local scaleform = {}
scaleform.__index = scaleform


function StartDraw(time)
	Citizen.CreateThread(function()
		local fading = false
		while not AnnouncementScaleform do Wait(0) end
		local StartTime = GetGameTimer()
		while true do
			AnnouncementScaleform:Draw2D()

			if GetGameTimer() - StartTime > time * 1000 then 
					fading = true
					AnnouncementScaleform:CallFunction("SHARD_ANIM_OUT", 2, 1) 
			end
			if GetGameTimer() - StartTime > (time + 1.25) * 1000  then
					AnnouncementScaleform:Dispose()
					fading = false
				return 
			end
			Wait(0)
		end
	end)
end

RegisterNetEvent("Scaleform:Announce")
AddEventHandler("Scaleform:Announce", function(time, announcement)
	Citizen.CreateThread(function()
		StartDraw(time)
	end)
		AnnouncementScaleform = Scaleform.Request("MIDSIZED_MESSAGE")
		AnnouncementScaleform:CallFunction("SHOW_SHARD_MIDSIZED_MESSAGE", announce_title, announcement, 2, true, true)
end)

function Scaleform.Request(Name)
	local ScaleformHandle = RequestScaleformMovie(Name)
	local StartTime = GetGameTimer()
	while not HasScaleformMovieLoaded(ScaleformHandle) do Citizen.Wait(0) 
		if GetGameTimer() - StartTime >= 5000 then
			print("loading failed")
			return
		end 
	end
	print("Loaded")
	local data = {name = Name, handle = ScaleformHandle}
	return setmetatable(data, scaleform)
end

function scaleform:CallScaleFunction(scType, theFunction, ...)
	BeginScaleformMovieMethod(self.handle, theFunction)
    local arg = {...}
    if arg ~= nil then
        for i=1,#arg do
            local sType = type(arg[i])
            if sType == "boolean" then
                PushScaleformMovieMethodParameterBool(arg[i])
			elseif sType == "number" then
				if math.type(arg[i]) == "integer" then
					PushScaleformMovieMethodParameterInt(arg[i])
				else
					PushScaleformMovieMethodParameterFloat(arg[i])
				end
            elseif sType == "string" then
                PushScaleformMovieMethodParameterString(arg[i])
            else
                PushScaleformMovieMethodParameterInt()
            end
		end
	end
	return EndScaleformMovieMethod()
end

function scaleform:CallFunction(theFunction, ...)
    self:CallScaleFunction("normal", theFunction, ...)
end

function scaleform:Draw2D(alpha)
	DrawScaleformMovieFullscreen(self.handle, 255, 255, 255, (alpha and alpha or 255))
end

function scaleform:Dispose()
	SetScaleformMovieAsNoLongerNeeded(self.handle)
	setmetatable({}, scaleform)
end
