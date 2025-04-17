import { Test, TestingModule } from '@nestjs/testing';
import { WalletTrackerController } from './wallet-tracker.controller';

describe('WalletTrackerController', () => {
  let controller: WalletTrackerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WalletTrackerController],
    }).compile();

    controller = module.get<WalletTrackerController>(WalletTrackerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
