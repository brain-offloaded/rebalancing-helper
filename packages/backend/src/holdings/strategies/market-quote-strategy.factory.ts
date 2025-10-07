import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { YahooFinanceService } from '../../yahoo/yahoo-finance.service';
import type { MarketQuoteStrategy } from './market-quote.strategy';
import { YahooMarketQuoteStrategy } from './yahoo-market.strategy';
import { KrxGoldMarketQuoteStrategy } from './krx-gold.strategy';
import { NaverGoldPriceService } from '../../naver/naver-gold.service';
import { BithumbService } from '../../bithumb/bithumb.service';
import { BithumbMarketQuoteStrategy } from './bithumb-market.strategy';

interface MarketConfig {
  yahooSuffix: string | null;
  expectedYahooMarkets: string[];
}

@Injectable()
export class MarketQuoteStrategyFactory {
  private readonly strategyCache = new Map<string, MarketQuoteStrategy>();
  private readonly marketConfigCache = new Map<string, MarketConfig>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly yahooFinance: YahooFinanceService,
    private readonly naverGoldService: NaverGoldPriceService,
    private readonly bithumbService: BithumbService,
  ) {}

  async createStrategy(market: string): Promise<MarketQuoteStrategy> {
    const cachedStrategy = this.strategyCache.get(market);

    if (cachedStrategy) {
      return cachedStrategy;
    }

    const strategy = await this.buildStrategy(market);
    this.strategyCache.set(market, strategy);
    return strategy;
  }

  private async buildStrategy(market: string): Promise<MarketQuoteStrategy> {
    if (market === 'KRX_GOLD') {
      return new KrxGoldMarketQuoteStrategy(this.naverGoldService);
    }

    if (market === 'BTC') {
      return new BithumbMarketQuoteStrategy(this.bithumbService);
    }

    const marketConfig = await this.getMarketConfig(market);

    return new YahooMarketQuoteStrategy(this.yahooFinance, {
      yahooSuffix: marketConfig.yahooSuffix,
      expectedMarkets: marketConfig.expectedYahooMarkets,
    });
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

    const config: MarketConfig = {
      yahooSuffix: marketRecord.yahooSuffix,
      expectedYahooMarkets: this.normalizeYahooMarkets(
        marketRecord.yahooMarketIdentifiers,
      ),
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
