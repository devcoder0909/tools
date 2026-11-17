# PowerShell script to register an autonomous twice-daily Windows Task Scheduler job for Google & Bing Indexing
$taskName = "GudmudConvertDailyIndexing"
$batPath = Join-Path $PSScriptRoot "daily-indexing.bat"

Write-Host "Registering autonomous scheduled task '$taskName'..." -ForegroundColor Cyan
Write-Host "Batch target: $batPath" -ForegroundColor Gray

# Trigger twice daily: 9:00 AM and 9:00 PM (staying safely within Google's 200 URL/day quota)
$trigger1 = New-ScheduledTaskTrigger -Daily -At 9:00AM
$trigger2 = New-ScheduledTaskTrigger -Daily -At 9:00PM
$action = New-ScheduledTaskAction -Execute $batPath
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

try {
    # Unregister existing if present
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue
    Register-ScheduledTask -TaskName $taskName -Trigger @($trigger1, $trigger2) -Action $action -Settings $settings -Description "Autonomous twice-daily Google Indexing API and IndexNow publisher for Gudmud Convert"
    Write-Host "Successfully registered scheduled task '$taskName'! Configured to run automatically at 9:00 AM and 9:00 PM every day." -ForegroundColor Green
} catch {
    Write-Host "Could not register Windows Task automatically: $($_.Exception.Message)" -ForegroundColor Yellow
}
