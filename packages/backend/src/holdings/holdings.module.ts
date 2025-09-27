import { Module } from '@nestjs/common';
import { HoldingsService } from './holdings.service';
import { HoldingsResolver } from './holdings.resolver';
import { MarketDataService } from './market-data.service';
import { YahooFinanceService } from './yahoo-finance.service';
import { CurrencyConversionService } from './currency-conversion.service';

@Module({
  providers: [
    HoldingsService,
    HoldingsResolver,
    MarketDataService,
    YahooFinanceService,
    CurrencyConversionService,
  ],
  exports: [HoldingsService, CurrencyConversionService],
})
export class HoldingsModule {}
