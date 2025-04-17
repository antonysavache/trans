import { Controller, Get, Param, Post } from '@nestjs/common';
import { TransactionTrackerService } from './transaction-tracker/transaction-tracker.service';
import { GoogleSheetsService } from './google-sheets/google-sheets.service';
import { Wallet } from './models/wallet.model';
import { Transaction } from './models/transaction.model';

@Controller('wallet-tracker')
export class WalletTrackerController {
  constructor(
    private readonly trackerService: TransactionTrackerService,
    private readonly googleSheetsService: GoogleSheetsService,
  ) {}

  @Get('wallets')
  async getWallets(): Promise<Wallet[]> {
    return this.googleSheetsService.getWalletList();
  }

  @Get('transactions/:walletAddress')
  getTransactions(@Param('walletAddress') walletAddress: string): Transaction[] {
    return this.trackerService.getWalletTransactions(walletAddress);
  }
  
  @Get('transactions')
  getAllTransactions(): Transaction[] {
    return this.trackerService.getAllTransactions();
  }

  @Post('track')
  async track(): Promise<{ success: boolean; message: string; transactions: Transaction[] }> {
    try {
      const transactions = await this.trackerService.manualTrackTransactions();
      return { 
        success: true, 
        message: `Transaction tracking completed successfully. Found ${transactions.length} transactions.`,
        transactions
      };
    } catch (error) {
      return { 
        success: false, 
        message: `Error tracking transactions: ${error.message}`,
        transactions: []
      };
    }
  }

  @Get('status')
  getStatus(): { status: string; version: string; timestamp: string } {
    return {
      status: 'running',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }
}
