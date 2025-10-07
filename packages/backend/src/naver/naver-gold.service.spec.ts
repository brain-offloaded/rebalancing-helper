import { Logger } from '@nestjs/common';
import { NaverGoldPriceService } from './naver-gold.service';

describe('NaverGoldPriceService', () => {
  let service: NaverGoldPriceService;

  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    service = new NaverGoldPriceService();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('네이버 HTML에서 최신 금 가격을 파싱한다', async () => {
    const sampleHtml = `
      <table>
        <tbody>
          <tr class="up">
            <td class="date">2025.10.02</td>
            <td class="num">174,239.08</td>
            <td class="num"><img src="ico_up.gif" width="7" height="6" alt=""> 432.43</td>
          </tr>
        </tbody>
      </table>
    `;
    jest
      .spyOn(
        service as unknown as { fetchHtml(): Promise<string> },
        'fetchHtml',
      )
      .mockResolvedValue(sampleHtml);

    const result = await service.getLatestPrice();

    expect(result).toEqual({
      price: 174_239.08,
      asOf: new Date(Date.UTC(2025, 9, 2)),
    });
  });

  it('필수 데이터가 없으면 null을 반환한다', async () => {
    const invalidHtml = `<table><tbody><tr class="up"><td class="date"></td></tr></tbody></table>`;
    jest
      .spyOn(
        service as unknown as { fetchHtml(): Promise<string> },
        'fetchHtml',
      )
      .mockResolvedValue(invalidHtml);

    const result = await service.getLatestPrice();

    expect(result).toBeNull();
  });
});
