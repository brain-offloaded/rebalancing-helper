import { Injectable, Logger } from '@nestjs/common';

import {
  Decimal,
  DecimalInput,
  createDecimal,
} from '@rebalancing-helper/common';

import type { YahooFinanceQuote } from './yahoo-finance.types';
import { YahooFinanceService } from './yahoo-finance.service';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5분

interface CachedRate {
  rate: Decimal;
  expiresAt: number;
}

@Injectable()
export class CurrencyConversionService {
  private readonly logger = new Logger(CurrencyConversionService.name);
  private readonly cache = new Map<string, CachedRate>();

  constructor(private readonly yahooFinanceService: YahooFinanceService) {}

  async getRate(fromCurrency: string, toCurrency: string): Promise<Decimal> {
    const from = fromCurrency.trim().toUpperCase();
    const to = toCurrency.trim().toUpperCase();

    if (from === to) {
      return createDecimal(1);
    }

    const cacheKey = `${from}:${to}`;
    const now = Date.now();
    const cached = this.cache.get(cacheKey);

    if (cached && cached.expiresAt > now) {
      return cached.rate;
    }

    const rate = await this.fetchRate(from, to);

    this.cache.set(cacheKey, {
      rate,
      expiresAt: now + CACHE_TTL_MS,
    });

    return rate;
  }

  async convert(
    amount: DecimalInput,
    fromCurrency: string,
    toCurrency: string,
  ): Promise<Decimal> {
    const rate = await this.getRate(fromCurrency, toCurrency);
    return rate.times(createDecimal(amount));
  }

  private async fetchRate(from: string, to: string): Promise<Decimal> {
    const directSymbol = this.buildYahooSymbol(from, to);
    const directRate = await this.requestRate(directSymbol);

    if (directRate) {
      return directRate;
    }

    const reverseSymbol = this.buildYahooSymbol(to, from);
    const reverseRate = await this.requestRate(reverseSymbol);

    if (reverseRate) {
      return createDecimal(1).dividedBy(reverseRate);
    }

    throw new Error(`Exchange rate not available for ${from}/${to}`);
  }

  private buildYahooSymbol(base: string, quote: string): string {
    return `${base}${quote}=X`;
  }

  private async requestRate(symbol: string): Promise<Decimal | null> {
    try {
      const quote = await this.yahooFinanceService.getQuote(symbol);
      const decimalValue = this.extractPrice(quote);
      if (decimalValue) {
        return decimalValue;
      }
      return null;
    } catch (error: unknown) {
      this.logger.debug(
        `환율 조회 실패 (${symbol}): ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return null;
    }
  }

  private extractPrice(quote: YahooFinanceQuote | null): Decimal | null {
    if (!quote) {
      return null;
    }

    const candidates = [
      quote.regularMarketPrice,
      quote.regularMarketPreviousClose,
      quote.regularMarketOpen,
      quote.bid,
      quote.ask,
    ];

    for (const candidate of candidates) {
      if (
        typeof candidate === 'number' &&
        Number.isFinite(candidate) &&
        candidate > 0
      ) {
        return createDecimal(candidate);
      }
    }

    return null;
  }
}
