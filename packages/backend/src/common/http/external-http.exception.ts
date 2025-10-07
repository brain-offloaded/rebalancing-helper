import { AxiosError } from 'axios';

export interface ExternalHttpExceptionMetadata {
  url?: string;
  status?: number;
  cause?: unknown;
}

export class ExternalHttpException extends Error {
  readonly metadata: ExternalHttpExceptionMetadata;

  constructor(
    message: string,
    metadata: ExternalHttpExceptionMetadata = {},
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'ExternalHttpException';
    this.metadata = metadata;
  }

  static fromAxiosError(
    error: AxiosError,
    metadata: ExternalHttpExceptionMetadata = {},
  ): ExternalHttpException {
    const status = error.response?.status;
    const url = error.config?.url ?? metadata.url;
    const message =
      error.message ??
      (status
        ? `HTTP request failed with status ${status}`
        : 'HTTP request failed without response');

    return new ExternalHttpException(message, {
      ...metadata,
      status,
      url,
      cause: error,
    });
  }
}
