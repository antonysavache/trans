import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleSheetsService } from '../google-sheets/google-sheets.service';
import { TronApiService } from '../tron-api/tron-api.service';
import { Transaction } from '../models/transaction.model';
import { Wallet } from '../models/wallet.model';

@Injectable()
export class TransactionTrackerService implements OnModuleInit {
  private readonly logger = new Logger(TransactionTrackerService.name);
  private transactions: Record<string, Transaction[]> = {};
  private readonly checkIntervalMs: number;
  
  constructor(
    private configService: ConfigService,
    private googleSheetsService: GoogleSheetsService,
    private tronApiService: TronApiService,
  ) {
    const intervalMinutes = this.configService.get<number>('CHECK_INTERVAL_MINUTES') || 60;
    this.checkIntervalMs = intervalMinutes * 60 * 1000;
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
    
    this.logger.log(`Transaction tracker initialized with check interval of ${this.checkIntervalMs/60000} minutes`);
  }

  async trackTransactions() {
    this.logger.log('Starting scheduled transaction tracking');
    
    try {
      // Get wallet list from Google Sheets
      const wallets = await this.googleSheetsService.getWalletList();
      
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
      
      // Save all new transactions to the Google Sheet
      if (allNewTransactions.length > 0) {
        this.logger.log(`Saving ${allNewTransactions.length} transactions to Google Sheet`);
        await this.googleSheetsService.saveTransactions(allNewTransactions);
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
      
      // Store transactions in memory
      if (!this.transactions[wallet.address]) {
        this.transactions[wallet.address] = [];
      }
      
      // Add new transactions to the front of the array (newest first)
      this.transactions[wallet.address] = [
        ...transactions,
        ...this.transactions[wallet.address],
      ];
      
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
  
  // Method to get transactions for a specific wallet (could be used by a controller)
  getWalletTransactions(walletAddress: string): Transaction[] {
    return this.transactions[walletAddress] || [];
  }
  
  // Method to get all transactions from all wallets
  getAllTransactions(): Transaction[] {
    return Object.values(this.transactions).flat();
  }
  
  // Method to manually trigger transaction tracking
  async manualTrackTransactions() {
    this.logger.log('Manually triggering transaction tracking');
    await this.trackTransactions();
    return this.getAllTransactions();
  }
}
