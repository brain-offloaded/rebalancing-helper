import { Injectable, Logger } from '@nestjs/common';
import YahooFinance from 'yahoo-finance2';
import type {
  YahooFinanceQuote,
  YahooFinanceQuoteOptions,
} from './yahoo-finance.types';

@Injectable()
export class YahooFinanceService {
  private readonly logger = new Logger(YahooFinanceService.name);
  private readonly yf: InstanceType<typeof YahooFinance>;

  constructor() {
    this.yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });
  }

  async getQuote(
    symbol: string,
    options?: YahooFinanceQuoteOptions,
  ): Promise<YahooFinanceQuote | null> {
    try {
      const result = await this.yf.quote(symbol, options);
      return result ?? null;
    } catch (error) {
      this.logger.warn(
        `Failed to fetch quote for ${symbol}: ${(error as Error).message}`,
      );
      return null;
    }
  }
}
