import { Injectable, Logger } from '@nestjs/common';

import type { Decimal } from '@rebalancing-helper/common';
import { createDecimal } from '@rebalancing-helper/common';

import { ExternalHttpService } from '../common/http/external-http.service';

interface BithumbTickerData {
  closing_price?: string;
  date?: string;
}

interface BithumbApiResponse {
  status: string;
  data?: BithumbTickerData | null;
}

@Injectable()
export class BithumbService {
  private static readonly BASE_URL = 'https://api.bithumb.com/public/ticker';
  private readonly logger = new Logger(BithumbService.name);

  constructor(private readonly httpService: ExternalHttpService) {}

  async getTicker(
    symbol: string,
  ): Promise<{ price: Decimal; asOf: Date } | null> {
    const normalizedSymbol = symbol.trim().toUpperCase();

    if (!normalizedSymbol) {
      return null;
    }

    try {
      const ticker = await this.fetchTicker(normalizedSymbol);

      if (!ticker) {
        return null;
      }

      const rawPrice = ticker.closing_price;

      if (rawPrice === undefined || rawPrice === null || rawPrice === '') {
        return null;
      }

      const numericPrice = Number(rawPrice);

      if (!Number.isFinite(numericPrice)) {
        return null;
      }

      const priceDecimal = createDecimal(rawPrice);

      if (priceDecimal.isNegative()) {
        return null;
      }

      const timestampRaw = ticker.date ? Number(ticker.date) : Number.NaN;

      if (!Number.isFinite(timestampRaw)) {
        return null;
      }

      const timestamp =
        timestampRaw < 1_000_000_000_000 ? timestampRaw * 1000 : timestampRaw;
      const asOf = new Date(timestamp);

      if (Number.isNaN(asOf.getTime())) {
        return null;
      }

      return { price: priceDecimal, asOf };
    } catch (error) {
      this.logger.warn(
        `Failed to fetch ticker from Bithumb: ${(error as Error).message}`,
      );
      return null;
    }
  }

  private async fetchTicker(symbol: string): Promise<BithumbTickerData | null> {
    const url = `${BithumbService.BASE_URL}/${encodeURIComponent(
      `${symbol}_KRW`,
    )}`;

    const response = await this.httpService.getJson<BithumbApiResponse>(url);

    if (response.status !== '0000' || !response.data) {
      return null;
    }

    return response.data ?? null;
  }
}
