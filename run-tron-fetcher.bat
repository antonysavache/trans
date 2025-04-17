@echo off
echo ============================================
echo TRON Transaction Fetcher - Direct Method
echo ============================================

echo Compiling TypeScript...
call npx tsc --project tsconfig.direct.json

echo Running transaction fetcher...
node dist/fetch-tron-transactions.js

echo.
echo ============================================
echo Done! Check transactions.txt for results.
echo ============================================
echo.
echo Press any key to close...
pause > nul
