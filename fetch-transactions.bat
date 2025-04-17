@echo off
echo ============================================
echo TRON Transaction Fetcher - Simple Version
echo ============================================

echo Compiling TypeScript...
call npx tsc src/fetch-transactions.ts src/tron-api.ts --outDir ./dist --esModuleInterop true --resolveJsonModule true --moduleResolution node

echo Running transaction fetcher...
node dist/fetch-transactions.js

echo.
echo ============================================
echo Done! Check transactions.txt for results.
echo ============================================
echo.
echo Press any key to close...
pause > nul
