@echo off
cd /d "%~dp0\.."
set LOG_FILE="%~dp0indexing.log"

echo ==================================================== >> %LOG_FILE%
echo  Execution Timestamp: %DATE% %TIME% >> %LOG_FILE%
echo ==================================================== >> %LOG_FILE%

call pnpm run indexing >> %LOG_FILE% 2>&1
echo Finished at %TIME% >> %LOG_FILE%
echo. >> %LOG_FILE%
