import { Injectable, Logger } from '@nestjs/common';
import https from 'node:https';

interface BithumbTickerData {
  closing_price?: string;
  date?: string;
}

interface BithumbApiResponse {
  status: string;
  data?: BithumbTickerData | null;
}

@Injectable()
export class BithumbService {
  private static readonly BASE_URL =
    'https://api.bithumb.com/public/ticker';
  private readonly logger = new Logger(BithumbService.name);

  async getTicker(
    symbol: string,
  ): Promise<{ price: number; asOf: Date } | null> {
    const normalizedSymbol = symbol.trim().toUpperCase();

    if (!normalizedSymbol) {
      return null;
    }

    try {
      const ticker = await this.fetchTicker(normalizedSymbol);

      if (!ticker) {
        return null;
      }

      const price = Number(ticker.closing_price);

      if (!Number.isFinite(price)) {
        return null;
      }

      const timestampRaw = ticker.date ? Number(ticker.date) : Number.NaN;

      if (!Number.isFinite(timestampRaw)) {
        return null;
      }

      const timestamp =
        timestampRaw < 1_000_000_000_000 ? timestampRaw * 1000 : timestampRaw;
      const asOf = new Date(timestamp);

      if (Number.isNaN(asOf.getTime())) {
        return null;
      }

      return { price, asOf };
    } catch (error) {
      this.logger.warn(
        `Failed to fetch ticker from Bithumb: ${(error as Error).message}`,
      );
      return null;
    }
  }

  private async fetchTicker(
    symbol: string,
  ): Promise<BithumbTickerData | null> {
    const url = `${BithumbService.BASE_URL}/${encodeURIComponent(
      `${symbol}_KRW`,
    )}`;

    return new Promise<BithumbTickerData | null>((resolve, reject) => {
      https
        .get(url, (res) => {
          if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
            res.resume();
            reject(
              new Error(`Unexpected status code: ${res.statusCode ?? 'N/A'}`),
            );
            return;
          }

          const chunks: Buffer[] = [];

          res.on('data', (chunk: Buffer) => {
            chunks.push(Buffer.from(chunk));
          });

          res.on('end', () => {
            try {
              const raw = Buffer.concat(chunks).toString('utf8');
              const parsed = JSON.parse(raw) as BithumbApiResponse;

              if (parsed.status !== '0000' || !parsed.data) {
                resolve(null);
                return;
              }

              resolve(parsed.data ?? null);
            } catch (err) {
              reject(err);
            }
          });
        })
        .on('error', (err) => {
          reject(err);
        });
    });
  }
}
