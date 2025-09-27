import { Injectable } from '@nestjs/common';
import yahooFinance from 'yahoo-finance2';
import type {
  YahooFinanceQuote,
  YahooFinanceQuoteOptions,
} from './yahoo-finance.types';

@Injectable()
export class YahooFinanceService {
  constructor() {
    yahooFinance.suppressNotices?.(['yahooSurvey']);
  }

  async getQuote(
    symbol: string,
    options?: YahooFinanceQuoteOptions,
  ): Promise<YahooFinanceQuote | null> {
    const result = await yahooFinance.quote(symbol, options);
    return result ?? null;
  }
}
