import { Logger } from '@nestjs/common';
import { ExternalHttpService } from '../common/http/external-http.service';
import { BithumbService } from './bithumb.service';

describe('BithumbService', () => {
  let service: BithumbService;
  let httpService: jest.Mocked<ExternalHttpService>;

  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    httpService = {
      getJson: jest.fn(),
      getBuffer: jest.fn(),
      getText: jest.fn(),
    } as unknown as jest.Mocked<ExternalHttpService>;

    service = new BithumbService(httpService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('빗썸 시세 API 응답을 파싱해 종가와 시각을 반환한다', async () => {
    httpService.getJson.mockResolvedValue({
      status: '0000',
      data: {
        closing_price: '42890000',
        date: `${1_700_000_000_000}`,
      },
    });

    const result = await service.getTicker('btc');

    expect(result?.price.toNumber()).toBe(42_890_000);
    expect(result?.asOf).toEqual(new Date(1_700_000_000_000));
  });

  it('가격이나 시각이 없으면 null을 반환한다', async () => {
    httpService.getJson.mockResolvedValue({
      status: '0000',
      data: { closing_price: undefined, date: undefined },
    });

    const result = await service.getTicker('BTC');

    expect(result).toBeNull();
  });

  it('요청 중 예외가 발생하면 null을 반환한다', async () => {
    httpService.getJson.mockRejectedValue(new Error('network error'));

    const result = await service.getTicker('BTC');

    expect(Logger.prototype.warn).toHaveBeenCalled();
    expect(result).toBeNull();
  });
});
