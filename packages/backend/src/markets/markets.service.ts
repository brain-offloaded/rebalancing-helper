import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Market } from './markets.entities';

@Injectable()
export class MarketsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<Market[]> {
    const records = await this.prisma.market.findMany({
      orderBy: { displayName: 'asc' },
    });

    return records.map((record) => ({
      id: record.id,
      code: record.code,
      displayName: record.displayName,
      yahooSuffix: record.yahooSuffix,
      yahooMarketIdentifiers: this.normalizeIdentifiers(
        record.yahooMarketIdentifiers,
      ),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }));
  }

  private normalizeIdentifiers(raw: string): string[] {
    return raw
      .split(',')
      .map((value) => value.trim())
      .filter((value): value is string => value.length > 0);
  }
}
