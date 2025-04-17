@echo off
echo Компиляция и запуск приложения для получения транзакций TRON...

echo Компиляция TypeScript...
call npx tsc

echo Запуск fetcher-а транзакций...
node dist/wallet-tracker/fetch-transactions.js

echo Готово! Проверьте файл transactions.txt в корне проекта.
type transactions.txt
pause
