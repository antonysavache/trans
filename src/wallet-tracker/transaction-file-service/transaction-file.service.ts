import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TronApiService } from '../tron-api/tron-api.service';
import { Transaction } from '../models/transaction.model';
import { Wallet } from '../models/wallet.model';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class TransactionFileService implements OnModuleInit {
  private readonly logger = new Logger(TransactionFileService.name);
  private readonly checkIntervalMs: number;
  private readonly outputFilePath: string;
  
  constructor(
    private configService: ConfigService,
    private tronApiService: TronApiService,
  ) {
    const intervalMinutes = this.configService.get<number>('CHECK_INTERVAL_MINUTES') || 60;
    this.checkIntervalMs = intervalMinutes * 60 * 1000;
    this.outputFilePath = path.join(process.cwd(), 'transactions.txt');
  }

  async onModuleInit() {
    // Initial check on startup
    await this.trackTransactions();
    
    // Set up interval manually
    setInterval(() => {
      this.trackTransactions().catch(err => 
        this.logger.error('Error in scheduled transaction tracking', err)
      );
    }, this.checkIntervalMs);
    
    this.logger.log(`Transaction file service initialized with check interval of ${this.checkIntervalMs/60000} minutes`);
    this.logger.log(`Transactions will be saved to: ${this.outputFilePath}`);
  }

  async trackTransactions() {
    this.logger.log('Starting scheduled transaction tracking');
    
    try {
      // Define wallets to track (hardcoded for now)
      const wallets: Wallet[] = [
        {
          address: 'TPmJwoz7Wa8Jgc4v6685uyT4FsMpNY6NE',
          lastCheckedTimestamp: Math.floor(Date.now() / 1000) - 86400 // 1 day ago
        },
        {
          address: 'TDZDkLmMRX23kQz1H8vooiSxxuPaJL5bcc',
          lastCheckedTimestamp: Math.floor(Date.now() / 1000) - 86400 // 1 day ago
        }
      ];
      
      if (!wallets || wallets.length === 0) {
        this.logger.warn('No wallets found to track');
        return;
      }
      
      this.logger.log(`Found ${wallets.length} wallets to track`);
      
      // Collect all new transactions
      const allNewTransactions: Transaction[] = [];
      
      // For each wallet, get new transactions
      for (const wallet of wallets) {
        const walletTransactions = await this.processWalletTransactions(wallet);
        if (walletTransactions.length > 0) {
          allNewTransactions.push(...walletTransactions);
        }
      }
      
      // Save all new transactions to text file
      if (allNewTransactions.length > 0) {
        this.logger.log(`Saving ${allNewTransactions.length} transactions to file`);
        await this.saveTransactionsToFile(allNewTransactions);
      } else {
        this.logger.log('No new transactions to save');
      }
      
      this.logger.log('Completed transaction tracking');
    } catch (error) {
      this.logger.error('Error during transaction tracking', error);
    }
  }
  
  private async processWalletTransactions(wallet: Wallet): Promise<Transaction[]> {
    try {
      this.logger.log(`Processing transactions for wallet: ${wallet.address}`);
      
      // Get transactions since last check
      const startTimestamp = wallet.lastCheckedTimestamp;
      const transactions = await this.tronApiService.getTransactions(
        wallet.address, 
        startTimestamp
      );
      
      if (transactions.length === 0) {
        this.logger.log(`No new transactions found for wallet: ${wallet.address}`);
        return [];
      }
      
      this.logger.log(`Found ${transactions.length} new transactions for wallet: ${wallet.address}`);
      
      // Log transaction details
      for (const tx of transactions) {
        this.logTransaction(wallet, tx);
      }
      
      return transactions;
    } catch (error) {
      this.logger.error(`Error processing transactions for wallet: ${wallet.address}`, error);
      return [];
    }
  }
  
  private logTransaction(wallet: Wallet, transaction: Transaction) {
    const direction = transaction.outputAddress === wallet.address ? 'OUT' : 'IN';
    const amount = transaction.amount;
    const tokenName = transaction.currency || 'Unknown Token';
    
    this.logger.log(
      `[${wallet.address}] ${direction}: ${amount} ${tokenName} | ` +
      `From: ${transaction.outputAddress} To: ${transaction.inputAddress} | ` +
      `Hash: ${transaction.hash} | ` +
      `Time: ${transaction.date}`
    );
  }
  
  private async saveTransactionsToFile(transactions: Transaction[]): Promise<void> {
    try {
      // Format transactions for the file
      const formattedTransactions = transactions.map(tx => {
        const direction = tx.outputAddress === tx.inputAddress ? 'SELF' : 
                         tx.outputAddress === 'TPmJwoz7Wa8Jgc4v6685uyT4FsMpNY6NE' || 
                         tx.outputAddress === 'TDZDkLmMRX23kQz1H8vooiSxxuPaJL5bcc' ? 'OUT' : 'IN';
        
        return [
          `Date: ${tx.date}`,
          `Type: ${direction}`,
          `From: ${tx.outputAddress}`,
          `To: ${tx.inputAddress}`,
          `Amount: ${tx.amount} ${tx.currency}`,
          `USD Value: ${tx.usdValue || 'N/A'}`,
          `Hash: ${tx.hash}`,
          `Block: ${tx.blockNumber}`,
          `Status: ${tx.status}`,
          '----------------------------------------'
        ].join('\n');
      });
      
      // Create or append to the file
      const content = formattedTransactions.join('\n\n');
      
      // Check if file exists
      let fileContent = '';
      if (fs.existsSync(this.outputFilePath)) {
        fileContent = fs.readFileSync(this.outputFilePath, 'utf8');
        fileContent += '\n\n';
      }
      
      // Write content
      fs.writeFileSync(this.outputFilePath, fileContent + content, 'utf8');
      
      this.logger.log(`Successfully saved ${transactions.length} transactions to ${this.outputFilePath}`);
    } catch (error) {
      this.logger.error('Error saving transactions to file', error);
    }
  }
}
