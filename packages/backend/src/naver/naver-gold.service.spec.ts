import { ExternalHttpService } from '../common/http/external-http.service';
import { NaverGoldPriceService } from './naver-gold.service';

describe('NaverGoldPriceService', () => {
  let service: NaverGoldPriceService;
  let httpService: jest.Mocked<ExternalHttpService>;

  const quote = {
    reutersCode: 'M04020000',
    stockExchangeType: { code: 'KRX' },
    unit: '원/g',
    closePrice: '183,940',
    localTradedAt: '2026-09-28T14:50:59+09:00',
  };

  beforeEach(() => {
    httpService = {
      getJson: jest.fn(),
    } as unknown as jest.Mocked<ExternalHttpService>;
    service = new NaverGoldPriceService(httpService);
  });

  it('네이버 KRX 국내 금 단건 응답에서 1g 가격과 시각을 읽는다', async () => {
    httpService.getJson.mockResolvedValue(quote);

    const result = await service.getLatestPrice();

    expect(httpService.getJson).toHaveBeenCalledWith(
      'https://stock.naver.com/api/securityService/marketindex/metals/M04020000',
    );
    expect(result.price.toNumber()).toBe(183_940);
    expect(result.asOf).toEqual(new Date('2026-09-28T14:50:59+09:00'));
  });

  it.each([
    null,
    { ...quote, reutersCode: 'GCcv1' },
    { ...quote, stockExchangeType: { code: 'CMX' } },
    { ...quote, unit: 'USD/OZS' },
    { ...quote, closePrice: '' },
    { ...quote, closePrice: '0' },
    { ...quote, closePrice: '-100' },
    { ...quote, closePrice: 'not a price' },
    { ...quote, localTradedAt: 'invalid date' },
  ])('KRX 1g 시세가 아닌 응답은 가격으로 사용하지 않는다', async (body) => {
    httpService.getJson.mockResolvedValue(body);

    await expect(service.getLatestPrice()).rejects.toThrow(
      'Invalid KRX gold quote from Naver',
    );
  });

  it('외부 조회 실패는 호출자에게 전달한다', async () => {
    const error = new Error('Unexpected status code: 410');
    httpService.getJson.mockRejectedValue(error);

    await expect(service.getLatestPrice()).rejects.toBe(error);
  });
});
