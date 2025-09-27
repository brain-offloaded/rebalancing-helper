import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MarketDataService } from './market-data.service';
import { YahooFinanceService } from './yahoo-finance.service';
import type { YahooFinanceQuote } from './yahoo-finance.types';

describe('MarketDataService', () => {
  let prismaMock: { market: { findUnique: jest.Mock } };
  let service: MarketDataService;
  let yahooFinanceServiceMock: jest.Mocked<YahooFinanceService>;

  const mockQuote = (
    override: Partial<YahooFinanceQuote> = {},
  ): YahooFinanceQuote =>
    ({
      symbol: override.symbol ?? 'VOO',
      longName:
        (override.longName as string | undefined) ?? 'Vanguard S&P 500 ETF',
      regularMarketPrice:
        (override.regularMarketPrice as number | undefined) ?? 410.5,
      currency: override.currency ?? 'USD',
      financialCurrency: override.financialCurrency ?? 'USD',
      market: override.market ?? 'us_market',
      exchange: override.exchange ?? 'NYSEArca',
      fullExchangeName:
        (override.fullExchangeName as string | undefined) ?? 'NYSEArca',
      regularMarketTime:
        override.regularMarketTime ?? new Date(1_700_000_000_000),
      shortName: override.shortName,
    } as unknown as YahooFinanceQuote);

  beforeEach(() => {
    yahooFinanceServiceMock = {
      getQuote: jest.fn(),
    } as unknown as jest.Mocked<YahooFinanceService>;
    prismaMock = {
      market: {
        findUnique: jest.fn(),
      },
    };

    prismaMock.market.findUnique.mockResolvedValue({
      yahooSuffix: null,
      yahooMarketIdentifiers: 'us_market',
    });

    service = new MarketDataService(
      prismaMock as unknown as PrismaService,
      yahooFinanceServiceMock,
    );
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

    prismaMock.market.findUnique.mockResolvedValueOnce({
      yahooSuffix: '.KS',
      yahooMarketIdentifiers: 'krx_market',
    });

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

  it('캐시된 결과를 재사용한다', async () => {
    yahooFinanceServiceMock.getQuote.mockResolvedValue(mockQuote());

    await service.getQuote('US', 'VOO');
    await service.getQuote('US', 'VOO');

    expect(yahooFinanceServiceMock.getQuote).toHaveBeenCalledTimes(1);
  });
});
