import { Logger } from '@nestjs/common';
import { ExternalHttpService } from '../common/http/external-http.service';
import { NaverGoldPriceService } from './naver-gold.service';

describe('NaverGoldPriceService', () => {
  let service: NaverGoldPriceService;
  let httpService: jest.Mocked<ExternalHttpService>;
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    warnSpy = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);
    httpService = {
      getBuffer: jest.fn(),
      getJson: jest.fn(),
      getText: jest.fn(),
    } as unknown as jest.Mocked<ExternalHttpService>;

    service = new NaverGoldPriceService(httpService);
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
    httpService.getBuffer.mockResolvedValue(Buffer.from(sampleHtml, 'utf8'));

    const result = await service.getLatestPrice();

    expect(result?.price.toNumber()).toBeCloseTo(174_239.08, 2);
    expect(result?.asOf).toEqual(new Date(Date.UTC(2025, 9, 2)));
  });

  it('필수 데이터가 없으면 null을 반환한다', async () => {
    const invalidHtml = `<table><tbody><tr class="up"><td class="date"></td></tr></tbody></table>`;
    httpService.getBuffer.mockResolvedValue(Buffer.from(invalidHtml, 'utf8'));

    const result = await service.getLatestPrice();

    expect(result).toBeNull();
  });

  it('HTTP 요청이 실패하면 warn 로그를 출력하고 null을 반환한다', async () => {
    const error = new Error('network down');
    httpService.getBuffer.mockRejectedValue(error);

    const result = await service.getLatestPrice();

    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith(
      `Failed to fetch gold price from Naver: ${error.message}`,
    );
  });

  it('행은 있지만 셀 데이터가 없으면 null을 반환한다', async () => {
    const html = `<tr class="down"></tr>`;
    httpService.getBuffer.mockResolvedValue(Buffer.from(html, 'utf8'));

    const result = await service.getLatestPrice();

    expect(result).toBeNull();
  });

  it('금 가격 행이 없으면 null을 반환한다', async () => {
    httpService.getBuffer.mockResolvedValue(
      Buffer.from('<div>empty</div>', 'utf8'),
    );

    const result = await service.getLatestPrice();

    expect(result).toBeNull();
  });

  it('유효한 숫자가 아니면 null을 반환한다', async () => {
    const html = `
      <tr class="down">
        <td>2024.05.01</td>
        <td>174,239.0a</td>
      </tr>
    `;
    httpService.getBuffer.mockResolvedValue(Buffer.from(html, 'utf8'));

    const result = await service.getLatestPrice();

    expect(result).toBeNull();
  });

  it('음수 가격이면 null을 반환한다', async () => {
    const html = `
      <tr class="up">
        <td>2024.05.01</td>
        <td>-174,239.08</td>
      </tr>
    `;
    httpService.getBuffer.mockResolvedValue(Buffer.from(html, 'utf8'));

    const result = await service.getLatestPrice();

    expect(result).toBeNull();
  });

  it('날짜 파싱에 실패하면 null을 반환한다', async () => {
    const html = `
      <tr class="up">
        <td>2024/05/01</td>
        <td>174,239.08</td>
      </tr>
    `;
    httpService.getBuffer.mockResolvedValue(Buffer.from(html, 'utf8'));

    const result = await service.getLatestPrice();

    expect(result).toBeNull();
  });
});
