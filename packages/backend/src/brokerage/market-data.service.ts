import { Injectable } from '@nestjs/common';

@Injectable()
export class MarketDataService {
  async getLatestPrice(symbol: string): Promise<number> {
    const normalized = symbol.trim();

    if (!normalized) {
      return 0;
    }

    const characterSum = normalized
      .toUpperCase()
      .split('')
      .reduce((sum, char) => sum + char.charCodeAt(0), 0);

    const basePrice = 20 + (characterSum % 400) / 2;

    return Number(basePrice.toFixed(2));
  }
}
