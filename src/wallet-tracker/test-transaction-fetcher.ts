import { TronApiFixedService } from './tron-api/tron-api-fixed.service';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  console.log('Starting TRON transaction fetcher test...');
  
  // Создаем экземпляры сервисов
  const configService = new ConfigService();
  const tronApiService = new TronApiFixedService(configService);
  
  // Адреса кошельков для отслеживания
  const walletAddresses = [
    'TPmJwoz7Wa8Jgc4v6685uyT4FsMpNY6NE',
    'TDZDkLmMRX23kQz1H8vooiSxxuPaJL5bcc'
  ];
  
  // Получаем транзакции для каждого кошелька
  const allTransactions = [];
  
  for (const address of walletAddresses) {
    console.log(`Fetching transactions for wallet: ${address}`);
    
    // Получаем транзакции за последние 24 часа
    const startTimestamp = Math.floor(Date.now() / 1000) - 86400; // 24 часа назад
    const transactions = await tronApiService.getTransactions(address, startTimestamp);
    
    console.log(`Found ${transactions.length} transactions for wallet ${address}`);
    allTransactions.push(...transactions);
    
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
  fs.writeFileSync(outputFilePath, formattedTransactions.join('\n\n'), 'utf8');
  
  console.log(`Successfully saved ${allTransactions.length} transactions to ${outputFilePath}`);
  console.log('Test completed!');
}

// Запускаем скрипт
main().catch(error => {
  console.error('Error in test script:', error);
});
