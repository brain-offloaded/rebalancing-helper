import { CurrencyConversionService } from './currency-conversion.service';
import { YahooFinanceService } from './yahoo-finance.service';
import type { YahooFinanceQuote } from './yahoo-finance.types';

describe('CurrencyConversionService', () => {
  let yahooFinanceMock: jest.Mocked<YahooFinanceService>;
  let service: CurrencyConversionService;

  const buildQuote = (price?: number): YahooFinanceQuote | null => {
    if (price === undefined) {
      return null;
    }

    return {
      regularMarketPrice: price,
      regularMarketPreviousClose: price,
      regularMarketOpen: price,
      bid: price,
      ask: price,
    } as unknown as YahooFinanceQuote;
  };

  beforeEach(() => {
    yahooFinanceMock = {
      getQuote: jest.fn(),
    } as unknown as jest.Mocked<YahooFinanceService>;
    service = new CurrencyConversionService(yahooFinanceMock);
  });

  it('returns 1 when currencies are identical', async () => {
    await expect(service.getRate('USD', 'USD')).resolves.toBe(1);
    expect(yahooFinanceMock.getQuote).not.toHaveBeenCalled();
  });

  it('fetches direct exchange rate and caches it', async () => {
    yahooFinanceMock.getQuote.mockResolvedValue(buildQuote(1300));

    await expect(service.getRate('USD', 'KRW')).resolves.toBe(1300);
    await expect(service.getRate('USD', 'KRW')).resolves.toBe(1300);

    expect(yahooFinanceMock.getQuote).toHaveBeenCalledTimes(1);
    expect(yahooFinanceMock.getQuote).toHaveBeenCalledWith('USDKRW=X');
  });

  it('falls back to reverse symbol when direct quote is unavailable', async () => {
    yahooFinanceMock.getQuote
      .mockResolvedValueOnce(buildQuote(undefined))
      .mockResolvedValueOnce(buildQuote(1300));

    const rate = await service.getRate('KRW', 'USD');

    expect(rate).toBeCloseTo(1 / 1300, 10);
    expect(yahooFinanceMock.getQuote).toHaveBeenNthCalledWith(1, 'KRWUSD=X');
    expect(yahooFinanceMock.getQuote).toHaveBeenNthCalledWith(2, 'USDKRW=X');
  });

  it('throws when neither direct nor reverse quotes are available', async () => {
    yahooFinanceMock.getQuote.mockResolvedValue(null);

    await expect(service.getRate('EUR', 'JPY')).rejects.toThrow(
      'Exchange rate not available',
    );
  });

  it('converts amount using fetched rate', async () => {
    yahooFinanceMock.getQuote.mockResolvedValue(buildQuote(2));

    await expect(service.convert(50, 'USD', 'CAD')).resolves.toBe(100);
  });
});
