import yahooFinance from 'yahoo-finance2';
import type {
  YahooFinanceQuote,
  YahooFinanceQuoteOptions,
} from './yahoo-finance.types';
import { YahooFinanceService } from './yahoo-finance.service';

jest.mock('yahoo-finance2', () => ({
  __esModule: true,
  default: {
    suppressNotices: jest.fn(),
    quote: jest.fn(),
  },
}));

const yahooFinanceMock = yahooFinance as jest.Mocked<typeof yahooFinance>;

describe('YahooFinanceService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('yahooSurvey 안내 메시지를 숨긴다', () => {
    new YahooFinanceService();

    expect(yahooFinanceMock.suppressNotices).toHaveBeenCalledWith([
      'yahooSurvey',
    ]);
  });

  it('Yahoo Finance API 를 호출하고 응답을 반환한다', async () => {
    const service = new YahooFinanceService();
    const quote = { symbol: 'VOO' } as unknown as YahooFinanceQuote;
    const options = {
      fields: ['symbol'],
    } as unknown as YahooFinanceQuoteOptions;

    yahooFinanceMock.quote.mockResolvedValueOnce(quote);

    await expect(service.getQuote('VOO', options)).resolves.toBe(quote);
    expect(yahooFinanceMock.quote).toHaveBeenCalledWith('VOO', options);
  });

  it('응답이 없으면 null 을 반환한다', async () => {
    const service = new YahooFinanceService();

    yahooFinanceMock.quote.mockResolvedValueOnce(undefined);

    await expect(service.getQuote('QQQ')).resolves.toBeNull();
  });
});
