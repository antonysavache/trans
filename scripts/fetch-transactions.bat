@echo off
echo Компиляция TypeScript...
call npx tsc

echo Запуск fetcher-а транзакций...
node dist/wallet-tracker/fetch-transactions.js %*

echo Готово! Проверьте файл transactions.txt в корне проекта.
pause
