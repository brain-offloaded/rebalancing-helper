import { HttpService } from '@nestjs/axios';
import { NotFoundException } from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { of } from 'rxjs';
import { MarketDataService } from './market-data.service';

describe('MarketDataService', () => {
  let httpServiceMock: jest.Mocked<HttpService>;
  let service: MarketDataService;

  const mockResponse = (override: Partial<Record<string, unknown>> = {}) =>
    of({
      data: {
        quoteResponse: {
          result: [
            {
              symbol: override.symbol ?? 'VOO',
              longName:
                (override.longName as string | undefined) ??
                'Vanguard S&P 500 ETF',
              regularMarketPrice:
                (override.regularMarketPrice as number | undefined) ?? 410.5,
              currency: override.currency ?? 'USD',
              market: override.market ?? 'us_market',
              exchange: override.exchange ?? 'NYSEArca',
              regularMarketTime: 1_700_000_000,
            },
          ],
        },
      },
    } as AxiosResponse);

  beforeEach(() => {
    httpServiceMock = {
      get: jest.fn(),
    } as unknown as jest.Mocked<HttpService>;

    service = new MarketDataService(httpServiceMock);
  });

  it('미국 시장 종목을 조회하고 정보를 반환한다', async () => {
    httpServiceMock.get.mockReturnValue(mockResponse());

    const quote = await service.getQuote('US', 'VOO');

    expect(httpServiceMock.get).toHaveBeenCalledWith(
      'https://query1.finance.yahoo.com/v7/finance/quote',
      { params: { symbols: 'VOO' } },
    );
    expect(quote).toMatchObject({
      symbol: 'VOO',
      price: 410.5,
      currency: 'USD',
      market: 'US',
    });
  });

  it('한국 시장 종목은 접미사를 붙여 조회한다', async () => {
    httpServiceMock.get.mockReturnValue(
      mockResponse({ symbol: '005930.KS', market: 'krx_market' }),
    );

    const quote = await service.getQuote('KOSPI', '005930');

    expect(httpServiceMock.get).toHaveBeenCalledWith(
      'https://query1.finance.yahoo.com/v7/finance/quote',
      { params: { symbols: '005930.KS' } },
    );
    expect(quote.market).toBe('KOSPI');
    expect(quote.symbol).toBe('005930');
  });

  it('응답 결과가 없으면 NotFoundException을 던진다', async () => {
    httpServiceMock.get.mockReturnValue(
      of({ data: { quoteResponse: { result: [] } } } as AxiosResponse),
    );

    await expect(service.getQuote('US', 'UNKNOWN')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('캐시된 결과를 재사용한다', async () => {
    httpServiceMock.get.mockReturnValue(mockResponse());

    await service.getQuote('US', 'VOO');
    await service.getQuote('US', 'VOO');

    expect(httpServiceMock.get).toHaveBeenCalledTimes(1);
  });
});
