import { Module } from '@nestjs/common';
import { HoldingsService } from './holdings.service';
import { HoldingsResolver } from './holdings.resolver';
import { MarketDataService } from './market-data.service';
import { YahooFinanceModule } from '../yahoo/yahoo.module';
import { MarketQuoteStrategyFactory } from './strategies/market-quote-strategy.factory';
import { NaverGoldPriceService } from '../naver/naver-gold.service';

@Module({
  imports: [YahooFinanceModule],
  providers: [
    HoldingsService,
    HoldingsResolver,
    MarketDataService,
    MarketQuoteStrategyFactory,
    NaverGoldPriceService,
  ],
  exports: [HoldingsService],
})
export class HoldingsModule {}
