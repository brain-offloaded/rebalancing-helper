import YahooFinance from 'yahoo-finance2';
import type {
  YahooFinanceQuote,
  YahooFinanceQuoteOptions,
} from './yahoo-finance.types';
import { YahooFinanceService } from './yahoo-finance.service';

const mockQuote = jest.fn();

// Mock YahooFinance class
jest.mock('yahoo-finance2', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      quote: mockQuote,
    })),
  };
});

describe('YahooFinanceService', () => {
  let service: YahooFinanceService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new YahooFinanceService();
  });

  it('YahooFinance 인스턴스를 올바른 옵션으로 생성한다', () => {
    expect(YahooFinance).toHaveBeenCalledWith({
      suppressNotices: ['yahooSurvey'],
    });
  });

  it('Yahoo Finance API 를 호출하고 응답을 반환한다', async () => {
    const quote = { symbol: 'VOO' } as unknown as YahooFinanceQuote;
    const options = {
      fields: ['symbol'],
    } as unknown as YahooFinanceQuoteOptions;

    mockQuote.mockResolvedValueOnce(quote);

    await expect(service.getQuote('VOO', options)).resolves.toBe(quote);
    expect(mockQuote).toHaveBeenCalledWith('VOO', options);
  });

  it('응답이 없으면 null 을 반환한다', async () => {
    mockQuote.mockResolvedValueOnce(undefined);

    await expect(service.getQuote('QQQ')).resolves.toBeNull();
  });

  it('에러 발생 시 null을 반환하고 로그를 남긴다', async () => {
    mockQuote.mockRejectedValueOnce(new Error('API Error'));

    await expect(service.getQuote('QQQ')).resolves.toBeNull();
  });
});
