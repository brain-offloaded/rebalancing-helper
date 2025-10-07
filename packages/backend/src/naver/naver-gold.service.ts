import { Injectable, Logger } from '@nestjs/common';
import { decode } from 'iconv-lite';
import { ExternalHttpService } from '../common/http/external-http.service';

interface GoldPriceRow {
  price: number;
  date: Date;
}

@Injectable()
export class NaverGoldPriceService {
  private static readonly GOLD_DAILY_QUOTE_URL =
    'https://finance.naver.com/marketindex/goldDailyQuote.naver';
  private readonly logger = new Logger(NaverGoldPriceService.name);

  constructor(private readonly httpService: ExternalHttpService) {}

  async getLatestPrice(): Promise<{ price: number; asOf: Date } | null> {
    try {
      const html = await this.fetchHtml();
      const row = this.extractLatestRow(html);

      if (!row) {
        return null;
      }

      return { price: row.price, asOf: row.date };
    } catch (error) {
      this.logger.warn(
        `Failed to fetch gold price from Naver: ${(error as Error).message}`,
      );
      return null;
    }
  }

  private async fetchHtml(): Promise<string> {
    const buffer = await this.httpService.getBuffer(
      NaverGoldPriceService.GOLD_DAILY_QUOTE_URL,
    );

    return decode(buffer, 'EUC-KR');
  }

  private extractLatestRow(html: string): GoldPriceRow | null {
    const rowMatch = html.match(/<tr class=["'](?:up|down)["'][\s\S]*?<\/tr>/i);

    if (!rowMatch) {
      return null;
    }

    const cells = Array.from(
      rowMatch[0].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi),
    );

    if (cells.length === 0) {
      return null;
    }

    const dateText = this.cleanCellText(cells[0][1]);
    const priceText = cells.length > 1 ? this.cleanCellText(cells[1][1]) : null;

    if (!dateText || !priceText) {
      return null;
    }

    const price = Number(priceText.replace(/,/g, ''));

    if (!Number.isFinite(price)) {
      return null;
    }

    const date = this.parseDate(dateText);

    if (!date) {
      return null;
    }

    return { price, date };
  }

  private cleanCellText(value: string): string {
    return value
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .trim();
  }

  private parseDate(value: string): Date | null {
    const match = value.match(/^(\d{4})\.(\d{2})\.(\d{2})$/);

    if (!match) {
      return null;
    }

    const [, year, month, day] = match;
    const date = new Date(Date.UTC(+year, Number(month) - 1, Number(day)));

    return Number.isNaN(date.getTime()) ? null : date;
  }
}
