import type { MarketQuoteSource } from '../market-quote.dto';

export interface MarketQuoteContext {
  market: string;
  symbol: string;
}

export interface MarketQuoteStrategyResult {
  rawQuote: MarketQuoteSource;
  expectedMarkets?: string[];
}

export interface MarketQuoteStrategy {
  getQuote(
    context: MarketQuoteContext,
  ): Promise<MarketQuoteStrategyResult | null>;
}
