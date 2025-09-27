import { Module } from '@nestjs/common';
import { HoldingsService } from './holdings.service';
import { HoldingsResolver } from './holdings.resolver';
import { MarketDataService } from './market-data.service';
import { YahooFinanceModule } from '../yahoo/yahoo.module';

@Module({
  imports: [YahooFinanceModule],
  providers: [HoldingsService, HoldingsResolver, MarketDataService],
  exports: [HoldingsService],
})
export class HoldingsModule {}
