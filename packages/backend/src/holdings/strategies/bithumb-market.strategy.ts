import type { BithumbService } from '../../bithumb/bithumb.service';
import type { MarketQuoteSource } from '../market-quote.dto';
import type {
  MarketQuoteContext,
  MarketQuoteStrategy,
  MarketQuoteStrategyResult,
} from './market-quote.strategy';

export class BithumbMarketQuoteStrategy implements MarketQuoteStrategy {
  constructor(private readonly bithumbService: BithumbService) {}

  async getQuote(
    context: MarketQuoteContext,
  ): Promise<MarketQuoteStrategyResult | null> {
    const ticker = await this.bithumbService.getTicker(context.symbol);

    if (!ticker) {
      return null;
    }

    const displaySymbol = context.symbol.trim().toUpperCase();
    const quote: MarketQuoteSource = {
      symbol: displaySymbol,
      shortName: `${displaySymbol}/KRW`,
      longName:
        displaySymbol === 'BTC'
          ? '비트코인 (BTC/KRW)'
          : `${displaySymbol} (KRW)`,
      regularMarketPrice: ticker.price.toNumber(),
      currency: 'KRW',
      financialCurrency: 'KRW',
      market: context.market,
      exchange: 'Bithumb',
      fullExchangeName: 'Bithumb KRW Market',
      regularMarketTime: ticker.asOf,
    };

    return { rawQuote: quote, expectedMarkets: [] };
  }
}
