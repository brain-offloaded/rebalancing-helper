import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MarketDataService } from './market-data.service';
import { YahooFinanceService } from '../yahoo/yahoo-finance.service';
import type { YahooFinanceQuote } from '../yahoo/yahoo-finance.types';
import { MarketQuoteStrategyFactory } from './strategies/market-quote-strategy.factory';
import { NaverGoldPriceService } from '../naver/naver-gold.service';
import { BithumbService } from '../bithumb/bithumb.service';

describe('MarketDataService', () => {
  let prismaMock: { market: { findUnique: jest.Mock } };
  let service: MarketDataService;
  let yahooFinanceServiceMock: jest.Mocked<YahooFinanceService>;
  let naverGoldServiceMock: jest.Mocked<NaverGoldPriceService>;
  let bithumbServiceMock: jest.Mocked<BithumbService>;
  let strategyFactory: MarketQuoteStrategyFactory;

  const mockQuote = (
    override: Partial<YahooFinanceQuote> = {},
  ): YahooFinanceQuote =>
    ({
      symbol: override.symbol ?? 'VOO',
      longName: override.longName ?? 'Vanguard S&P 500 ETF',
      regularMarketPrice: override.regularMarketPrice ?? 410.5,
      currency: override.currency ?? 'USD',
      financialCurrency: override.financialCurrency ?? 'USD',
      market: override.market ?? 'us_market',
      exchange: override.exchange ?? 'NYSEArca',
      fullExchangeName: override.fullExchangeName ?? 'NYSEArca',
      regularMarketTime:
        override.regularMarketTime ?? new Date(1_700_000_000_000),
      shortName: override.shortName,
    }) as unknown as YahooFinanceQuote;

  beforeEach(() => {
    yahooFinanceServiceMock = {
      getQuote: jest.fn(),
    } as unknown as jest.Mocked<YahooFinanceService>;
    naverGoldServiceMock = {
      getLatestPrice: jest.fn(),
    } as unknown as jest.Mocked<NaverGoldPriceService>;
    bithumbServiceMock = {
      getTicker: jest.fn(),
    } as unknown as jest.Mocked<BithumbService>;
    prismaMock = {
      market: {
        findUnique: jest.fn(),
      },
    };

    prismaMock.market.findUnique.mockImplementation(async ({ where }) => {
      if (where.code === 'US') {
        return {
          yahooSuffix: null,
          yahooMarketIdentifiers: 'us_market',
        };
      }

      if (where.code === 'KOSPI') {
        return {
          yahooSuffix: '.KS',
          yahooMarketIdentifiers: 'krx_market',
        };
      }

      return null;
    });

    strategyFactory = new MarketQuoteStrategyFactory(
      prismaMock as unknown as PrismaService,
      yahooFinanceServiceMock,
      naverGoldServiceMock,
      bithumbServiceMock,
    );

    service = new MarketDataService(strategyFactory);
  });

  it('미국 시장 종목을 조회하고 정보를 반환한다', async () => {
    yahooFinanceServiceMock.getQuote.mockResolvedValue(mockQuote());

    const quote = await service.getQuote('US', 'VOO');

    expect(yahooFinanceServiceMock.getQuote).toHaveBeenCalledWith('VOO');
    expect(quote).toMatchObject({
      symbol: 'VOO',
      price: 410.5,
      currency: 'USD',
      market: 'US',
    });
  });

  it('한국 시장 종목은 접미사를 붙여 조회한다', async () => {
    yahooFinanceServiceMock.getQuote.mockResolvedValue(
      mockQuote({ symbol: '005930.KS', market: 'krx_market' }),
    );

    const quote = await service.getQuote('KOSPI', '005930');

    expect(yahooFinanceServiceMock.getQuote).toHaveBeenCalledWith('005930.KS');
    expect(quote.market).toBe('KOSPI');
    expect(quote.symbol).toBe('005930');
  });

  it('등록되지 않은 시장이면 NotFoundException을 던진다', async () => {
    prismaMock.market.findUnique.mockResolvedValueOnce(null);

    await expect(service.getQuote('UNKNOWN', 'VOO')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('응답 결과가 없으면 NotFoundException을 던진다', async () => {
    yahooFinanceServiceMock.getQuote.mockResolvedValue(null);

    await expect(service.getQuote('US', 'UNKNOWN')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('KRX 금현물 시장은 네이버 금 가격을 활용한다', async () => {
    naverGoldServiceMock.getLatestPrice.mockResolvedValue({
      price: 173_000,
      asOf: new Date('2025-10-02T00:00:00Z'),
    });

    const quote = await service.getQuote('KRX_GOLD', 'KRXGOLD');

    expect(naverGoldServiceMock.getLatestPrice).toHaveBeenCalledTimes(1);
    expect(quote.symbol).toBe('KRXGOLD');
    expect(quote.name).toBe('KRX 금현물 (1g)');
    expect(quote.currency).toBe('KRW');
    expect(quote.price).toBe(173_000);
  });

  it('KRX 금현물 가격이 없으면 NotFoundException을 던진다', async () => {
    naverGoldServiceMock.getLatestPrice.mockResolvedValue(null);

    await expect(service.getQuote('KRX_GOLD', 'KRXGOLD')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('비트코인 시장은 빗썸 시세를 활용한다', async () => {
    const asOf = new Date('2025-10-02T00:00:00Z');
    bithumbServiceMock.getTicker.mockResolvedValue({
      price: 43_200_000,
      asOf,
    });

    const quote = await service.getQuote('BTC', 'btc');

    expect(bithumbServiceMock.getTicker).toHaveBeenCalledWith('BTC');
    expect(quote.currency).toBe('KRW');
    expect(quote.price).toBe(43_200_000);
    expect(quote.exchange).toBe('Bithumb KRW Market');
  });

  it('빗썸 시세가 없으면 NotFoundException을 던진다', async () => {
    bithumbServiceMock.getTicker.mockResolvedValue(null);

    await expect(service.getQuote('BTC', 'BTC')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('캐시된 결과를 재사용한다', async () => {
    yahooFinanceServiceMock.getQuote.mockResolvedValue(mockQuote());

    await service.getQuote('US', 'VOO');
    await service.getQuote('US', 'VOO');

    expect(yahooFinanceServiceMock.getQuote).toHaveBeenCalledTimes(1);
  });
});
