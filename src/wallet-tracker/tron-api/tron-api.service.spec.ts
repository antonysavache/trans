import { Test, TestingModule } from '@nestjs/testing';
import { TronApiService } from './tron-api.service';

describe('TronApiService', () => {
  let service: TronApiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TronApiService],
    }).compile();

    service = module.get<TronApiService>(TronApiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
