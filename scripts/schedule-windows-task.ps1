# PowerShell script to register a daily Windows Task Scheduler job for Google & Bing Indexing
$taskName = "GudmudConvertDailyIndexing"
$batPath = Join-Path $PSScriptRoot "daily-indexing.bat"

Write-Host "Registering daily scheduled task '$taskName'..." -ForegroundColor Cyan
Write-Host "Batch target: $batPath" -ForegroundColor Gray

# Trigger daily at 09:00 AM
$trigger = New-ScheduledTaskTrigger -Daily -At 9:00AM
$action = New-ScheduledTaskAction -Execute $batPath
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

try {
    # Unregister existing if present
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue
    Register-ScheduledTask -TaskName $taskName -Trigger $trigger -Action $action -Settings $settings -Description "Daily Google Indexing API and IndexNow publisher for Gudmud Convert"
    Write-Host "Successfully registered scheduled task '$taskName'! Will run daily at 9:00 AM." -ForegroundColor Green
} catch {
    Write-Host "Could not register Windows Task automatically (may require Run as Administrator): $($_.Exception.Message)" -ForegroundColor Yellow
}
