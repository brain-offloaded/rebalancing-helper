import { HttpService } from '@nestjs/axios';
import { Injectable, NotFoundException } from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { lastValueFrom } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';

export interface MarketQuote {
  symbol: string;
  displaySymbol: string;
  name: string;
  price: number;
  currency: string;
  market: string;
  exchange: string;
  lastUpdated: Date;
}

type YahooQuote = {
  symbol: string;
  longName?: string;
  shortName?: string;
  regularMarketPrice?: number;
  currency?: string;
  market?: string;
  exchange?: string;
  fullExchangeName?: string;
  regularMarketTime?: number;
};

type YahooQuoteResponse = {
  quoteResponse: {
    result: YahooQuote[];
  };
};

const YAHOO_ENDPOINT = 'https://query1.finance.yahoo.com/v7/finance/quote';

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
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
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

    const response = await lastValueFrom<AxiosResponse<YahooQuoteResponse>>(
      this.httpService.get<YahooQuoteResponse>(YAHOO_ENDPOINT, {
        params: { symbols: yahooSymbol },
      }),
    );

    const [rawQuote] = response.data.quoteResponse?.result ?? [];

    if (!rawQuote) {
      throw new NotFoundException('Market quote not found');
    }

    this.assertMarketMatch(
      normalizedMarket,
      marketConfig.expectedYahooMarkets,
      rawQuote.market,
    );

    const quote: MarketQuote = {
      symbol: normalizedSymbol,
      displaySymbol: rawQuote.symbol,
      name:
        rawQuote.longName ?? rawQuote.shortName ?? normalizedSymbol ?? symbol,
      price: rawQuote.regularMarketPrice ?? 0,
      currency: rawQuote.currency ?? 'USD',
      market: normalizedMarket,
      exchange: rawQuote.fullExchangeName ?? rawQuote.exchange ?? 'UNKNOWN',
      lastUpdated: rawQuote.regularMarketTime
        ? new Date(rawQuote.regularMarketTime * 1000)
        : new Date(),
    };

    this.cache.set(cacheKey, {
      value: quote,
      expiresAt: now + CACHE_TTL_MS,
    });

    return quote;
  }

  private toYahooSymbol(symbol: string, config: MarketConfig): string {
    return config.yahooSuffix ? `${symbol}${config.yahooSuffix}` : symbol;
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
