#!/bin/bash

# Скрипт для компиляции и запуска fetcher-а транзакций

echo "Компиляция TypeScript..."
npx tsc

echo "Запуск fetcher-а транзакций..."
node dist/wallet-tracker/fetch-transactions.js $@

echo "Готово! Проверьте файл transactions.txt в корне проекта."
