import type { MarketQuoteSource } from '../market-quote.dto';
import type {
  MarketQuoteContext,
  MarketQuoteStrategy,
  MarketQuoteStrategyResult,
} from './market-quote.strategy';
import type { NaverGoldPriceService } from '../../naver/naver-gold.service';

export class KrxGoldMarketQuoteStrategy implements MarketQuoteStrategy {
  constructor(private readonly naverGoldService: NaverGoldPriceService) {}

  async getQuote(
    context: MarketQuoteContext,
  ): Promise<MarketQuoteStrategyResult | null> {
    const latestPrice = await this.naverGoldService.getLatestPrice();

    if (!latestPrice) {
      return null;
    }

    const quote: MarketQuoteSource = {
      symbol: context.symbol,
      shortName: 'KRX 금현물',
      longName: 'KRX 금현물 (1g)',
      regularMarketPrice: latestPrice.price.toNumber(),
      currency: 'KRW',
      financialCurrency: 'KRW',
      market: context.market,
      exchange: 'KRX',
      fullExchangeName: 'KRX 금시장',
      regularMarketTime: latestPrice.asOf,
    };

    return { rawQuote: quote, expectedMarkets: [] };
  }
}
