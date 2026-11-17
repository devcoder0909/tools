@echo off
cd /d "%~dp0\.."
echo ====================================================
echo  Gudmud Convert - Daily Search Engine Indexing
echo ====================================================
call pnpm run indexing
echo.
echo Indexing dispatch complete.
