
object = Get-WmiObject -Query "SELECT * FROM Win32_Process WHERE ProcessId = 1196" | Select-Object WorkingSetSize

object.split = object.WorkingSetSize / 1MB