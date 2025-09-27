import { Module } from '@nestjs/common';
import { HoldingsService } from './holdings.service';
import { HoldingsResolver } from './holdings.resolver';
import { MarketDataService } from './market-data.service';
import { YahooFinanceService } from './yahoo-finance.service';

@Module({
  providers: [
    HoldingsService,
    HoldingsResolver,
    MarketDataService,
    YahooFinanceService,
  ],
  exports: [HoldingsService],
})
export class HoldingsModule {}
