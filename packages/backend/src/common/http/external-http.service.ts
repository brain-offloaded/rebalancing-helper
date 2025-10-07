import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import type { AxiosError, AxiosRequestConfig } from 'axios';
import { lastValueFrom } from 'rxjs';
import { ExternalHttpException } from './external-http.exception';

@Injectable()
export class ExternalHttpService {
  private readonly logger = new Logger(ExternalHttpService.name);

  constructor(private readonly httpService: HttpService) {}

  async getJson<T>(url: string, config: AxiosRequestConfig = {}): Promise<T> {
    const data = await this.request<T>({ ...config, url, method: 'GET' });
    return data;
  }

  async getBuffer(
    url: string,
    config: AxiosRequestConfig = {},
  ): Promise<Buffer> {
    const data = await this.request<ArrayBuffer | Buffer>({
      ...config,
      url,
      method: 'GET',
      responseType: 'arraybuffer',
    });

    if (Buffer.isBuffer(data)) {
      return Buffer.from(data);
    }

    if (data instanceof ArrayBuffer) {
      return Buffer.from(data);
    }

    return Buffer.from(data as ArrayBuffer);
  }

  async getText(url: string, config: AxiosRequestConfig = {}): Promise<string> {
    const data = await this.request<string>({
      ...config,
      url,
      method: 'GET',
      responseType: 'text',
      transformResponse: (value: string) => value,
    });

    return data;
  }

  private async request<T>(config: AxiosRequestConfig): Promise<T> {
    try {
      const response = await lastValueFrom(
        this.httpService.request<T>({
          validateStatus: () => true,
          ...config,
        }),
      );

      if (!response.status || response.status < 200 || response.status >= 300) {
        throw new ExternalHttpException(
          `Unexpected status code: ${response.status ?? 'N/A'}`,
          {
            url: config.url,
            status: response.status,
          },
        );
      }

      return response.data;
    } catch (error) {
      throw this.normalizeError(error, config);
    }
  }

  private normalizeError(
    error: unknown,
    config: AxiosRequestConfig,
  ): ExternalHttpException {
    if (error instanceof ExternalHttpException) {
      return error;
    }

    if (this.isAxiosError(error)) {
      const exception = ExternalHttpException.fromAxiosError(error, {
        url: config.url,
      });
      this.logger.warn(exception.message);
      return exception;
    }

    const unknownError = this.toError(error);

    const exception = new ExternalHttpException(unknownError.message, {
      url: config.url,
      cause: unknownError,
    });
    this.logger.warn(exception.message);
    return exception;
  }

  private isAxiosError(error: unknown): error is AxiosError {
    return (
      typeof error === 'object' &&
      error !== null &&
      (error as AxiosError).isAxiosError === true
    );
  }

  private toError(error: unknown): Error {
    if (typeof error === 'object' && error !== null && 'message' in error) {
      const candidate = error as { message?: unknown };
      if (typeof candidate.message === 'string') {
        return error as Error;
      }
    }

    return new Error('Unknown error during HTTP request');
  }
}
