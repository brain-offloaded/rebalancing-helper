import { HttpService } from '@nestjs/axios';
import { Logger } from '@nestjs/common';
import type { AxiosError } from 'axios';
import { of, throwError } from 'rxjs';
import { ExternalHttpException } from './external-http.exception';
import { ExternalHttpService } from './external-http.service';

describe('ExternalHttpService', () => {
  let httpService: jest.Mocked<HttpService>;
  let service: ExternalHttpService;
  let loggerWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    httpService = {
      request: jest.fn(),
    } as unknown as jest.Mocked<HttpService>;
    service = new ExternalHttpService(httpService);
    loggerWarnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
  });

  afterEach(() => {
    loggerWarnSpy.mockRestore();
  });

  it('GET JSON 요청이 성공하면 응답 데이터를 반환한다', async () => {
    httpService.request.mockReturnValue(
      of({ data: { price: 123 }, status: 200 } as any),
    );

    const result = await service.getJson<{ price: number }>(
      'http://example.com',
    );

    expect(result).toEqual({ price: 123 });
    expect(httpService.request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        url: 'http://example.com',
        validateStatus: expect.any(Function),
      }),
    );
  });

  it('GET Buffer 요청이 ArrayBuffer를 반환하면 Buffer로 변환한다', async () => {
    const arrayBuffer = new ArrayBuffer(8);
    httpService.request.mockReturnValue(
      of({ data: arrayBuffer, status: 200 } as any),
    );

    const result = await service.getBuffer('http://example.com');

    expect(Buffer.isBuffer(result)).toBe(true);
    expect(result.byteLength).toBe(arrayBuffer.byteLength);
  });

  it('GET Buffer 요청이 Buffer를 반환하면 그대로 반환한다', async () => {
    const buffer = Buffer.from('hello');
    httpService.request.mockReturnValue(
      of({ data: buffer, status: 200 } as any),
    );

    const result = await service.getBuffer('http://example.com');

    expect(result.equals(buffer)).toBe(true);
  });

  it('GET Text 요청이 성공하면 텍스트를 반환한다', async () => {
    httpService.request.mockReturnValue(
      of({ data: 'plain text', status: 200 } as any),
    );

    const result = await service.getText('http://example.com');

    expect(result).toBe('plain text');
  });

  it('응답 상태 코드가 2xx가 아니면 ExternalHttpException을 던진다', async () => {
    httpService.request.mockReturnValue(
      of({ data: 'error', status: 500 } as any),
    );

    await expect(service.getJson('http://example.com')).rejects.toThrow(
      ExternalHttpException,
    );
  });

  it('AxiosError가 발생하면 ExternalHttpException으로 변환한다', async () => {
    const axiosError = Object.assign(new Error('axios error'), {
      isAxiosError: true,
      response: { status: 503 },
      config: { url: 'http://example.com' },
    }) as AxiosError;
    httpService.request.mockReturnValue(throwError(() => axiosError));

    await expect(service.getJson('http://example.com')).rejects.toMatchObject({
      metadata: expect.objectContaining({
        url: 'http://example.com',
        status: 503,
      }),
    });
    expect(loggerWarnSpy).toHaveBeenCalled();
  });

  it('알 수 없는 오류가 발생하면 메시지가 정규화된 ExternalHttpException을 던진다', async () => {
    httpService.request.mockReturnValue(throwError(() => ({ foo: 'bar' })));

    await expect(service.getJson('http://example.com')).rejects.toMatchObject({
      message: 'Unknown error during HTTP request',
      metadata: expect.objectContaining({ url: 'http://example.com' }),
    });
    expect(loggerWarnSpy).toHaveBeenCalled();
  });
});
