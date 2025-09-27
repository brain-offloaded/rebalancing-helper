import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MarketDataService } from './market-data.service';
import yahooFinance from 'yahoo-finance2';

jest.mock('yahoo-finance2', () => ({
  __esModule: true,
  default: {
    quote: jest.fn(),
  },
}));

describe('MarketDataService', () => {
  let prismaMock: { market: { findUnique: jest.Mock } };
  let service: MarketDataService;
  let quoteMock: jest.Mock;

  const mockQuote = (override: Partial<Record<string, unknown>> = {}) =>
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
      shortName: override.shortName ?? undefined,
    } as unknown);

  beforeEach(() => {
    quoteMock = yahooFinance.quote as unknown as jest.Mock;
    quoteMock.mockReset();
    prismaMock = {
      market: {
        findUnique: jest.fn(),
      },
    };

    prismaMock.market.findUnique.mockResolvedValue({
      yahooSuffix: null,
      yahooMarketIdentifiers: 'us_market',
    });

    service = new MarketDataService(prismaMock as unknown as PrismaService);
  });

  it('미국 시장 종목을 조회하고 정보를 반환한다', async () => {
    quoteMock.mockResolvedValue(mockQuote());

    const quote = await service.getQuote('US', 'VOO');

    expect(quoteMock).toHaveBeenCalledWith('VOO');
    expect(quote).toMatchObject({
      symbol: 'VOO',
      price: 410.5,
      currency: 'USD',
      market: 'US',
    });
  });

  it('한국 시장 종목은 접미사를 붙여 조회한다', async () => {
    quoteMock.mockResolvedValue(
      mockQuote({ symbol: '005930.KS', market: 'krx_market' }),
    );

    prismaMock.market.findUnique.mockResolvedValueOnce({
      yahooSuffix: '.KS',
      yahooMarketIdentifiers: 'krx_market',
    });

    const quote = await service.getQuote('KOSPI', '005930');

    expect(quoteMock).toHaveBeenCalledWith('005930.KS');
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
    quoteMock.mockResolvedValue(undefined);

    await expect(service.getQuote('US', 'UNKNOWN')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('캐시된 결과를 재사용한다', async () => {
    quoteMock.mockResolvedValue(mockQuote());

    await service.getQuote('US', 'VOO');
    await service.getQuote('US', 'VOO');

    expect(quoteMock).toHaveBeenCalledTimes(1);
  });
});
