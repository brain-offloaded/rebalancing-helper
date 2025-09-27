import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { YahooFinanceService } from './yahoo-finance.service';
import type { YahooFinanceQuote } from './yahoo-finance.types';
import type { MarketQuote, MarketQuoteSource } from './market-quote.dto';

export type { MarketQuote } from './market-quote.dto';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5분 캐시 유지

type MarketConfig = {
  yahooSuffix: string | null;
  expectedYahooMarkets: string[];
};

@Injectable()
export class MarketDataService {
  private readonly cache = new Map<
    string,
    { value: MarketQuote; expiresAt: number }
  >();
  private readonly marketConfigCache = new Map<string, MarketConfig>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly yahooFinance: YahooFinanceService,
  ) {}

  async getQuote(market: string, symbol: string): Promise<MarketQuote> {
    const normalizedMarket = market.trim().toUpperCase();
    const normalizedSymbol = symbol.trim().toUpperCase();
    const cacheKey = `${normalizedMarket}:${normalizedSymbol}`;
    const now = Date.now();
    const cached = this.cache.get(cacheKey);

    if (cached && cached.expiresAt > now) {
      return cached.value;
    }

    const marketConfig = await this.getMarketConfig(normalizedMarket);
    const yahooSymbol = this.toYahooSymbol(normalizedSymbol, marketConfig);

    const rawQuote = await this.fetchQuote(yahooSymbol);

    if (!rawQuote) {
      throw new NotFoundException('Market quote not found');
    }

    this.assertMarketMatch(
      normalizedMarket,
      marketConfig.expectedYahooMarkets,
      rawQuote.market,
    );

    const quote = this.buildMarketQuote(
      normalizedSymbol,
      normalizedMarket,
      rawQuote,
    );

    this.cache.set(cacheKey, {
      value: quote,
      expiresAt: now + CACHE_TTL_MS,
    });

    return quote;
  }

  private toYahooSymbol(symbol: string, config: MarketConfig): string {
    return config.yahooSuffix ? `${symbol}${config.yahooSuffix}` : symbol;
  }

  private async fetchQuote(symbol: string): Promise<YahooQuote | null> {
    const quote = await this.yahooFinance.getQuote(symbol);
    return quote ?? null;
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

  private async getMarketConfig(market: string): Promise<MarketConfig> {
    const cached = this.marketConfigCache.get(market);
    if (cached) {
      return cached;
    }

    const marketRecord = await this.prisma.market.findUnique({
      where: { code: market },
      select: {
        yahooSuffix: true,
        yahooMarketIdentifiers: true,
      },
    });

    if (!marketRecord) {
      throw new NotFoundException('Market not supported');
    }

    const expectedMarkets = this.normalizeYahooMarkets(
      marketRecord.yahooMarketIdentifiers,
    );
    const config: MarketConfig = {
      yahooSuffix: marketRecord.yahooSuffix,
      expectedYahooMarkets: expectedMarkets,
    };

    this.marketConfigCache.set(market, config);
    return config;
  }

  private normalizeYahooMarkets(value: string): string[] {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter((item): item is string => item.length > 0);
  }
}

type YahooQuote = YahooFinanceQuote;
