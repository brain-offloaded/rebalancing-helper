import { Module } from '@nestjs/common';
import { HoldingsService } from './holdings.service';
import { HoldingsResolver } from './holdings.resolver';
import { MarketDataService } from './market-data.service';
import { YahooFinanceModule } from '../yahoo/yahoo.module';
import { ExternalHttpModule } from '../common/http/external-http.module';
import { MarketQuoteStrategyFactory } from './strategies/market-quote-strategy.factory';
import { NaverGoldPriceService } from '../naver/naver-gold.service';
import { BithumbService } from '../bithumb/bithumb.service';

@Module({
  imports: [YahooFinanceModule, ExternalHttpModule],
  providers: [
    HoldingsService,
    HoldingsResolver,
    MarketDataService,
    MarketQuoteStrategyFactory,
    NaverGoldPriceService,
    BithumbService,
  ],
  exports: [HoldingsService],
})
export class HoldingsModule {}
