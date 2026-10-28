import { Injectable } from '@nestjs/common';

import type { Decimal } from '@rebalancing-helper/common';
import { createDecimal } from '@rebalancing-helper/common';

import { ExternalHttpService } from '../common/http/external-http.service';

const KRX_GOLD_CODE = 'M04020000';
const KRX_GOLD_QUOTE_URL = `https://stock.naver.com/api/securityService/marketindex/metals/${KRX_GOLD_CODE}`;
const PRICE_PATTERN = /^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/;
const TIMESTAMP_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

@Injectable()
export class NaverGoldPriceService {
  constructor(private readonly httpService: ExternalHttpService) {}

  async getLatestPrice(): Promise<{ price: Decimal; asOf: Date }> {
    const response =
      await this.httpService.getJson<unknown>(KRX_GOLD_QUOTE_URL);

    if (typeof response !== 'object' || response === null) {
      throw new Error('Invalid KRX gold quote from Naver');
    }

    const quote = response as Record<string, unknown>;
    const exchange = quote.stockExchangeType;
    const rawPrice = quote.closePrice;
    const rawTimestamp = quote.localTradedAt;

    if (
      quote.reutersCode !== KRX_GOLD_CODE ||
      typeof exchange !== 'object' ||
      exchange === null ||
      (exchange as Record<string, unknown>).code !== 'KRX' ||
      quote.unit !== '원/g' ||
      typeof rawPrice !== 'string' ||
      !PRICE_PATTERN.test(rawPrice) ||
      typeof rawTimestamp !== 'string' ||
      !TIMESTAMP_PATTERN.test(rawTimestamp)
    ) {
      throw new Error('Invalid KRX gold quote from Naver');
    }

    const normalizedPrice = rawPrice.replace(/,/g, '');
    const numericPrice = Number(normalizedPrice);
    const asOf = new Date(rawTimestamp);

    if (
      !Number.isFinite(numericPrice) ||
      numericPrice <= 0 ||
      Number.isNaN(asOf.getTime())
    ) {
      throw new Error('Invalid KRX gold quote from Naver');
    }

    return { price: createDecimal(normalizedPrice), asOf };
  }
}
