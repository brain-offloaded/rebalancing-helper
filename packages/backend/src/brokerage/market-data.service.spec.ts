import { MarketDataService } from './market-data.service';

describe('MarketDataService', () => {
  let service: MarketDataService;

  beforeEach(() => {
    service = new MarketDataService();
  });

  it('심볼의 문자 합계를 기반으로 일관된 가격을 계산한다', async () => {
    await expect(service.getLatestPrice('AAPL')).resolves.toBe(163);
    await expect(service.getLatestPrice('msft')).resolves.toBe(177);
  });

  it('공백 심볼은 0을 반환한다', async () => {
    await expect(service.getLatestPrice('   ')).resolves.toBe(0);
  });
});
