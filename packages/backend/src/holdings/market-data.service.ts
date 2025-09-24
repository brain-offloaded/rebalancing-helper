import { HttpService } from '@nestjs/axios';
import { Injectable, NotFoundException } from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { lastValueFrom } from 'rxjs';

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

const MARKET_SUFFIX: Record<string, string> = {
  KOSPI: '.KS',
  KOSDAQ: '.KQ',
};

const YAHOO_MARKET_BY_INPUT: Record<string, string[]> = {
  US: ['us_market'],
  NYSE: ['us_market'],
  NASDAQ: ['us_market'],
  AMEX: ['us_market'],
  KOSPI: ['krx_market'],
  KOSDAQ: ['krx_market'],
};

const CACHE_TTL_MS = 5 * 60 * 1000; // 5분 캐시 유지

@Injectable()
export class MarketDataService {
  private readonly cache = new Map<
    string,
    { value: MarketQuote; expiresAt: number }
  >();

  constructor(private readonly httpService: HttpService) {}

  async getQuote(market: string, symbol: string): Promise<MarketQuote> {
    const normalizedMarket = market.trim().toUpperCase();
    const normalizedSymbol = symbol.trim().toUpperCase();
    const cacheKey = `${normalizedMarket}:${normalizedSymbol}`;
    const now = Date.now();
    const cached = this.cache.get(cacheKey);

    if (cached && cached.expiresAt > now) {
      return cached.value;
    }

    const yahooSymbol = this.toYahooSymbol(normalizedMarket, normalizedSymbol);

    const response = await lastValueFrom<AxiosResponse<YahooQuoteResponse>>(
      this.httpService.get<YahooQuoteResponse>(YAHOO_ENDPOINT, {
        params: { symbols: yahooSymbol },
      }),
    );

    const [rawQuote] = response.data.quoteResponse?.result ?? [];

    if (!rawQuote) {
      throw new NotFoundException('Market quote not found');
    }

    this.assertMarketMatch(normalizedMarket, rawQuote.market);

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

  private toYahooSymbol(market: string, symbol: string): string {
    const suffix = MARKET_SUFFIX[market];
    return suffix ? `${symbol}${suffix}` : symbol;
  }

  private assertMarketMatch(inputMarket: string, yahooMarket?: string): void {
    const expectedMarkets = YAHOO_MARKET_BY_INPUT[inputMarket];
    if (!expectedMarkets || !yahooMarket) {
      return;
    }

    if (!expectedMarkets.includes(yahooMarket)) {
      throw new NotFoundException('Market quote not found');
    }
  }
}
