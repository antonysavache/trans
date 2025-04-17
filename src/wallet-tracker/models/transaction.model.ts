export interface Transaction {
  txID: string;
  blockNumber: number;
  blockTimestamp: number;
  date: string; 
  outputAddress: string; // кошелек отправителя
  inputAddress: string;  // кошелек получателя
  hash: string;
  amount: number;
  currency: string;
  usdValue?: number;
  status: 'SUCCESS' | 'FAILED';
}
