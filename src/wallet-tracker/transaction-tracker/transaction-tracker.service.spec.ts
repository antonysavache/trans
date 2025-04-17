import { Test, TestingModule } from '@nestjs/testing';
import { TransactionTrackerService } from './transaction-tracker.service';

describe('TransactionTrackerService', () => {
  let service: TransactionTrackerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TransactionTrackerService],
    }).compile();

    service = module.get<TransactionTrackerService>(TransactionTrackerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
