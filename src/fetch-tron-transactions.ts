import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { TronApiFixedService, Transaction } from './tron-api-direct';

// Загружаем переменные окружения из .env файла
dotenv.config();

class SimpleConfigService {
  get<T>(key: string): T | undefined {
    return process.env[key] as unknown as T;
  }
}

async function main() {
  console.log('Starting TRON transaction fetcher...');
  
  // Создаем экземпляры сервисов
  const configService = new SimpleConfigService();
  const tronApiService = new TronApiFixedService(configService);
  
  // Адреса кошельков для отслеживания (можно передать через аргументы командной строки)
  let walletAddresses = [
    'TPmJwoz7Wa8Dgc4v6685ujYT4FsMpNY6NE',
    'TDZDkLmMRX23kQz1H8vooiSxxuPaJL5bcc',
    'TLpReiKYkqW9oSMDt7BRbZK2AfNYbnASpA',
    'TXQRQQvSRN14T4TwZVhjEmLFCyjDzKJLXb',
    'TUMjPvvsB9tzZoYQoJBZjhtdjBm7rW3EZp',
    'THiX1FfMHBRahQ7m5NV5SQ8r2ZzvjKTyT8'
  ];
  
  // Проверяем, есть ли аргументы командной строки с адресами
  const args = process.argv.slice(2);
  if (args.length > 0) {
    walletAddresses = args;
  }
  
  // Получаем транзакции для каждого кошелька
  const allTransactions: Transaction[] = [];
  
  for (const address of walletAddresses) {
    console.log(`Fetching transactions for wallet: ${address}`);
    
    // Получаем транзакции за последние 24 часа
    const startTimestamp = Math.floor(Date.now() / 1000) - 86400; // 24 часа назад
    try {
      const transactions = await tronApiService.getTransactions(address, startTimestamp);
      
      console.log(`Found ${transactions.length} transactions for wallet ${address}`);
      allTransactions.push(...transactions);
      
      // Выводим информацию о каждой транзакции
      for (const tx of transactions) {
        const direction = tx.outputAddress === address ? 'OUT' : 'IN';
        console.log(
          `[${address}] ${direction}: ${tx.amount} ${tx.currency} | ` +
          `From: ${tx.outputAddress} To: ${tx.inputAddress} | ` +
          `Hash: ${tx.hash} | ` +
          `Time: ${tx.date}`
        );
      }
    } catch (error) {
      console.error(`Error processing wallet ${address}:`, error);
    }
    
    // Небольшая задержка между запросами
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Сортируем все транзакции по времени (сначала новые)
  allTransactions.sort((a, b) => b.blockTimestamp - a.blockTimestamp);
  
  // Форматируем транзакции для вывода в файл
  const formattedTransactions = allTransactions.map(tx => {
    const direction = tx.outputAddress === tx.inputAddress ? 'SELF' : 
                    walletAddresses.includes(tx.outputAddress) ? 'OUT' : 'IN';
    
    return [
      `Date: ${tx.date}`,
      `Type: ${direction}`,
      `From: ${tx.outputAddress}`,
      `To: ${tx.inputAddress}`,
      `Amount: ${tx.amount} ${tx.currency}`,
      `Hash: ${tx.hash}`,
      `Block: ${tx.blockNumber}`,
      `Status: ${tx.status}`,
      '----------------------------------------'
    ].join('\n');
  });
  
  // Сохраняем в файл
  const outputFilePath = path.join(process.cwd(), 'transactions.txt');
  
  // Проверяем, существует ли файл
  let fileContent = '';
  if (fs.existsSync(outputFilePath)) {
    fileContent = fs.readFileSync(outputFilePath, 'utf8');
    
    // Добавляем разделитель между старыми и новыми данными
    if (fileContent) {
      fileContent += '\n\n======================\n';
      fileContent += `NEW TRANSACTIONS (${new Date().toISOString()})\n`;
      fileContent += '======================\n\n';
    }
  }
  
  // Записываем в файл (новое содержимое в начало)
  fs.writeFileSync(
    outputFilePath, 
    formattedTransactions.join('\n\n') + (fileContent ? '\n\n' + fileContent : ''), 
    'utf8'
  );
  
  console.log(`Successfully saved ${allTransactions.length} transactions to ${outputFilePath}`);
  console.log('Transaction fetching completed!');
}

// Запускаем скрипт
main().catch(error => {
  console.error('Error in fetching transactions:', error);
});
