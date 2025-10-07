import type { YahooFinanceService } from '../../yahoo/yahoo-finance.service';
import type { MarketQuoteSource } from '../market-quote.dto';
import type {
  MarketQuoteContext,
  MarketQuoteStrategy,
  MarketQuoteStrategyResult,
} from './market-quote.strategy';

interface YahooMarketConfig {
  yahooSuffix: string | null;
  expectedMarkets: string[];
}

export class YahooMarketQuoteStrategy implements MarketQuoteStrategy {
  constructor(
    private readonly yahooFinance: YahooFinanceService,
    private readonly config: YahooMarketConfig,
  ) {}

  async getQuote(
    context: MarketQuoteContext,
  ): Promise<MarketQuoteStrategyResult | null> {
    const yahooSymbol = this.toYahooSymbol(context.symbol);
    const quote = await this.yahooFinance.getQuote(yahooSymbol);

    if (!quote) {
      return null;
    }

    return {
      rawQuote: quote as MarketQuoteSource,
      expectedMarkets: this.config.expectedMarkets,
    };
  }

  private toYahooSymbol(symbol: string): string {
    return this.config.yahooSuffix
      ? `${symbol}${this.config.yahooSuffix}`
      : symbol;
  }
}
