import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google, sheets_v4 } from 'googleapis';
import { Wallet } from '../models/wallet.model';
import { Transaction } from '../models/transaction.model';

@Injectable()
export class GoogleSheetsService {
  private readonly logger = new Logger(GoogleSheetsService.name);
  private sheets: sheets_v4.Sheets;

  constructor(private configService: ConfigService) {
    this.initGoogleSheets();
  }

  private initGoogleSheets() {
    try {
      const apiKey = this.configService.get<string>('GOOGLE_SHEETS_API_KEY') || '';
      this.sheets = google.sheets({ version: 'v4', auth: apiKey });
    } catch (error) {
      this.logger.error('Failed to initialize Google Sheets API', error);
      throw error;
    }
  }

  async getWalletList(): Promise<Wallet[]> {
    try {
      const spreadsheetId = this.configService.get<string>('GOOGLE_SHEET_ID') || '';
      const range = this.configService.get<string>('GOOGLE_SHEET_RANGE') || 'Sheet1!I:I';
      
      // Check for missing configuration
      if (!spreadsheetId || spreadsheetId === 'your_sheet_id_here') {
        this.logger.warn('Missing GOOGLE_SHEET_ID in configuration. Using mock data.');
        return this.getMockWalletData();
      }

      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      });

      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        this.logger.warn('No data found in the Google Sheet');
        return [];
      }

      // Filter out empty rows and header rows
      return rows
        .filter(row => row[0] && typeof row[0] === 'string' && row[0].trim() !== '' && row[0] !== 'wallets')
        .map((row) => ({
          address: row[0],
          lastCheckedTimestamp: Math.floor(Date.now() / 1000) - 86400 // 24 hours ago
        }));
    } catch (error) {
      this.logger.error('Error fetching data from Google Sheets', error);
      // Return mock data in case of error for development
      this.logger.log('Using mock wallet data for development');
      return this.getMockWalletData();
    }
  }
  
  async saveTransactions(transactions: Transaction[]): Promise<void> {
    if (!transactions || transactions.length === 0) {
      this.logger.log('No transactions to save');
      return;
    }
    
    try {
      const spreadsheetId = this.configService.get<string>('GOOGLE_SHEET_ID') || '';
      
      // Find the first empty row
      let nextRow = 2; // Start at row 2 after header
      try {
        const response = await this.sheets.spreadsheets.values.get({
          spreadsheetId,
          range: 'Sheet1!A:A',
        });
        
        if (response.data.values && response.data.values.length > 0) {
          // Find first empty row
          nextRow = response.data.values.length + 1;
        }
      } catch (err) {
        this.logger.warn('Could not determine next row, using row 2', err);
      }
      
      // Prepare transaction data for saving
      const values = transactions.map(tx => [
        tx.date, // Date (A)
        tx.outputAddress, // output (B)
        tx.inputAddress, // input (C)
        tx.hash, // hash (D)
        tx.amount.toString(), // amount (E)
        tx.currency, // currency (F)
        tx.usdValue ? tx.usdValue.toString() : '', // to USD (G)
        '' // Empty column H
      ]);
      
      // Save to sheet
      await this.sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Sheet1!A${nextRow}`,
        valueInputOption: 'RAW',
        requestBody: {
          values
        }
      });
      
      this.logger.log(`Saved ${transactions.length} transactions to Google Sheet`);
    } catch (error) {
      this.logger.error('Error saving transactions to Google Sheets', error);
    }
  }
  
  // Provides sample data for development
  private getMockWalletData(): Wallet[] {
    return [
      {
        address: 'TPmJwoz7Wa8Jgc4v6685uyT4FsMpNY6NE',
        lastCheckedTimestamp: Math.floor(Date.now() / 1000) - 86400 // 1 day ago
      },
      {
        address: 'TDZDkLmMRX23kQz1H8vooiSxxuPaJL5bcc',
        lastCheckedTimestamp: Math.floor(Date.now() / 1000) - 86400 // 1 day ago
      }
    ];
  }
}
