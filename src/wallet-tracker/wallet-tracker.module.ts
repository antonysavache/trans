import { Module } from '@nestjs/common';
import { GoogleSheetsService } from './google-sheets/google-sheets.service';
import { TronApiService } from './tron-api/tron-api.service';
import { TransactionTrackerService } from './transaction-tracker/transaction-tracker.service';
import { WalletTrackerController } from './wallet-tracker.controller';

@Module({
  controllers: [WalletTrackerController],
  providers: [
    GoogleSheetsService, 
    TronApiService, 
    TransactionTrackerService
  ],
  exports: [
    TransactionTrackerService
  ]
})
export class WalletTrackerModule {}
