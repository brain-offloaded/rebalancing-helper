import { Module } from '@nestjs/common';
import { YahooFinanceService } from './yahoo-finance.service';
import { CurrencyConversionService } from './currency-conversion.service';

@Module({
  providers: [YahooFinanceService, CurrencyConversionService],
  exports: [YahooFinanceService, CurrencyConversionService],
})
export class YahooFinanceModule {}
