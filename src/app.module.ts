import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WalletTrackerModule } from './wallet-tracker/wallet-tracker.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    WalletTrackerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
