import { Injectable, NotFoundException } from '@nestjs/common';
import type { YahooFinanceQuote } from '../yahoo/yahoo-finance.types';
import type { MarketQuote, MarketQuoteSource } from './market-quote.dto';
import { MarketQuoteStrategyFactory } from './strategies/market-quote-strategy.factory';
import type {
  MarketQuoteStrategyResult,
  MarketQuoteStrategy,
} from './strategies/market-quote.strategy';

export type { MarketQuote } from './market-quote.dto';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5분 캐시 유지

@Injectable()
export class MarketDataService {
  private readonly cache = new Map<
    string,
    { value: MarketQuote; expiresAt: number }
  >();

  constructor(private readonly strategyFactory: MarketQuoteStrategyFactory) {}

  async getQuote(market: string, symbol: string): Promise<MarketQuote> {
    const normalizedMarket = market.trim().toUpperCase();
    const normalizedSymbol = symbol.trim().toUpperCase();
    const cacheKey = `${normalizedMarket}:${normalizedSymbol}`;
    const now = Date.now();
    const cached = this.cache.get(cacheKey);

    if (cached && cached.expiresAt > now) {
      return cached.value;
    }

    const strategy =
      await this.strategyFactory.createStrategy(normalizedMarket);
    const result = await this.fetchWithStrategy(strategy, {
      market: normalizedMarket,
      symbol: normalizedSymbol,
    });

    if (!result) {
      throw new NotFoundException('Market quote not found');
    }

    this.assertMarketMatch(
      normalizedMarket,
      result.expectedMarkets ?? [],
      result.rawQuote.market,
    );

    const quote = this.buildMarketQuote(
      normalizedSymbol,
      normalizedMarket,
      result.rawQuote,
    );

    this.cache.set(cacheKey, {
      value: quote,
      expiresAt: now + CACHE_TTL_MS,
    });

    return quote;
  }

  private async fetchWithStrategy(
    strategy: MarketQuoteStrategy,
    context: { market: string; symbol: string },
  ): Promise<MarketQuoteStrategyResult | null> {
    return strategy.getQuote(context);
  }

  private buildMarketQuote(
    normalizedSymbol: string,
    normalizedMarket: string,
    rawQuote: MarketQuoteSource,
  ): MarketQuote {
    const displaySymbol = rawQuote.symbol ?? normalizedSymbol;
    const name = rawQuote.longName ?? rawQuote.shortName ?? normalizedSymbol;
    const price = rawQuote.regularMarketPrice ?? 0;
    const currency = rawQuote.currency ?? rawQuote.financialCurrency ?? 'USD';
    const exchange =
      rawQuote.fullExchangeName ?? rawQuote.exchange ?? 'UNKNOWN';

    return {
      symbol: normalizedSymbol,
      displaySymbol,
      name,
      price,
      currency,
      market: normalizedMarket,
      exchange,
      lastUpdated: this.toLastUpdated(rawQuote.regularMarketTime),
    };
  }

  private toLastUpdated(value: YahooQuote['regularMarketTime']): Date {
    if (value instanceof Date) {
      return value;
    }

    if (typeof value === 'number') {
      return new Date(value * 1000);
    }

    return new Date();
  }

  private assertMarketMatch(
    inputMarket: string,
    expectedMarkets: string[],
    yahooMarket?: string,
  ): void {
    if (expectedMarkets.length === 0 || !yahooMarket) {
      return;
    }

    if (!expectedMarkets.includes(yahooMarket)) {
      throw new NotFoundException('Market quote not found');
    }
  }
}

type YahooQuote = YahooFinanceQuote;
