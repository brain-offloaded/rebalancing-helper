import { Injectable, NotFoundException } from '@nestjs/common';
import { HoldingSource as PrismaHoldingSource, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { HoldingTag, Holding } from './holdings.entities';
import {
  AddHoldingTagInput,
  RemoveHoldingTagInput,
  SetHoldingTagsInput,
  CreateManualHoldingInput,
  IncreaseManualHoldingInput,
  SetManualHoldingQuantityInput,
  ManualHoldingIdentifierInput,
} from './holdings.dto';
import { MarketDataService } from './market-data.service';

@Injectable()
export class HoldingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly marketDataService: MarketDataService,
  ) {}

  private async assertTagBelongsToUser(
    userId: string,
    tagId: string,
  ): Promise<void> {
    const tag = await this.prisma.tag.findFirst({
      where: { id: tagId, userId },
      select: { id: true },
    });

    if (!tag) {
      throw new NotFoundException('Tag not found');
    }
  }

  async addTag(userId: string, input: AddHoldingTagInput): Promise<HoldingTag> {
    await this.assertTagBelongsToUser(userId, input.tagId);

    return this.prisma.holdingTag.upsert({
      where: {
        user_holdingSymbol_tagId: {
          userId,
          holdingSymbol: input.holdingSymbol,
          tagId: input.tagId,
        },
      },
      update: {},
      create: {
        holdingSymbol: input.holdingSymbol,
        tagId: input.tagId,
        userId,
      },
    });
  }

  async removeTag(
    userId: string,
    input: RemoveHoldingTagInput,
  ): Promise<boolean> {
    try {
      await this.prisma.holdingTag.delete({
        where: {
          user_holdingSymbol_tagId: {
            userId,
            holdingSymbol: input.holdingSymbol,
            tagId: input.tagId,
          },
        },
      });
      return true;
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        return false;
      }
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: string }).code === 'P2025'
      ) {
        return false;
      }
      throw error;
    }
  }

  async setTags(
    userId: string,
    input: SetHoldingTagsInput,
  ): Promise<HoldingTag[]> {
    const ownershipChecks = input.tagIds.map((tagId) =>
      this.assertTagBelongsToUser(userId, tagId),
    );

    await Promise.all(ownershipChecks);

    return this.prisma.$transaction(async (tx) => {
      await tx.holdingTag.deleteMany({
        where: { holdingSymbol: input.holdingSymbol, userId },
      });

      const newTags = await Promise.all(
        input.tagIds.map((tagId) =>
          tx.holdingTag.create({
            data: {
              holdingSymbol: input.holdingSymbol,
              tagId,
              userId,
            },
          }),
        ),
      );

      return newTags;
    });
  }

  getHoldingTags(
    userId: string,
    holdingSymbol?: string,
  ): Promise<HoldingTag[]> {
    const normalizedSymbol = holdingSymbol ?? undefined;

    return this.prisma.holdingTag.findMany({
      where: {
        userId,
        ...(normalizedSymbol ? { holdingSymbol: normalizedSymbol } : {}),
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getTagsForHolding(
    userId: string,
    holdingSymbol: string,
  ): Promise<string[]> {
    const tags = await this.prisma.holdingTag.findMany({
      where: { holdingSymbol, userId },
      select: { tagId: true },
    });
    return tags.map((tag) => tag.tagId);
  }

  async getHoldingsForTag(userId: string, tagId: string): Promise<string[]> {
    await this.assertTagBelongsToUser(userId, tagId);

    const holdings = await this.prisma.holdingTag.findMany({
      where: { tagId, userId },
      select: { holdingSymbol: true },
    });
    return holdings.map((holding) => holding.holdingSymbol);
  }

  private async getManualHoldingOrThrow(
    userId: string,
    identifier: ManualHoldingIdentifierInput,
  ) {
    const holding = await this.prisma.holding.findUnique({
      where: {
        user_market_symbol_source: {
          userId,
          market: identifier.market,
          symbol: identifier.symbol,
          source: PrismaHoldingSource.MANUAL,
        },
      },
    });

    if (!holding) {
      throw new NotFoundException('Holding not found');
    }

    return holding;
  }

  getHoldings(
    userId: string,
    options: {
      source?: PrismaHoldingSource;
      accountId?: string;
    } = {},
  ): Promise<Holding[]> {
    const where: Prisma.HoldingWhereInput = {
      userId,
      ...(options.source ? { source: options.source } : {}),
      ...(options.accountId ? { accountId: options.accountId } : {}),
    };

    const orderBy = options.source === PrismaHoldingSource.MANUAL
      ? [{ market: 'asc' }, { symbol: 'asc' }]
      : [{ symbol: 'asc' }, { market: 'asc' }];

    return this.prisma.holding.findMany({
      where,
      orderBy,
    });
  }

  getManualHoldings(userId: string): Promise<Holding[]> {
    return this.getHoldings(userId, { source: PrismaHoldingSource.MANUAL });
  }

  async createManualHolding(
    userId: string,
    input: CreateManualHoldingInput,
  ): Promise<Holding> {
    const quote = await this.marketDataService.getQuote(
      input.market,
      input.symbol,
    );

    return this.prisma.holding.create({
      data: {
        userId,
        source: PrismaHoldingSource.MANUAL,
        accountId: null,
        market: quote.market,
        symbol: quote.symbol,
        name: quote.name,
        quantity: input.quantity,
        currentPrice: quote.price,
        marketValue: input.quantity * quote.price,
        averageCost: null,
        currency: quote.currency,
        lastUpdated: quote.lastUpdated,
      },
    });
  }

  async increaseManualHolding(
    userId: string,
    input: IncreaseManualHoldingInput,
  ): Promise<Holding> {
    const holding = await this.getManualHoldingOrThrow(userId, input);
    const nextQuantity = holding.quantity + input.quantityDelta;

    return this.prisma.holding.update({
      where: { id: holding.id },
      data: {
        quantity: nextQuantity,
        marketValue: nextQuantity * holding.currentPrice,
      },
    });
  }

  async setManualHoldingQuantity(
    userId: string,
    input: SetManualHoldingQuantityInput,
  ): Promise<Holding> {
    const holding = await this.getManualHoldingOrThrow(userId, input);

    return this.prisma.holding.update({
      where: { id: holding.id },
      data: {
        quantity: input.quantity,
        marketValue: input.quantity * holding.currentPrice,
      },
    });
  }

  async deleteManualHolding(
    userId: string,
    input: ManualHoldingIdentifierInput,
  ): Promise<boolean> {
    try {
      await this.prisma.holding.delete({
        where: {
          user_market_symbol_source: {
            userId,
            market: input.market,
            symbol: input.symbol,
            source: PrismaHoldingSource.MANUAL,
          },
        },
      });

      return true;
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        return false;
      }
      throw error;
    }
  }

  async syncManualHoldingPrice(
    userId: string,
    input: ManualHoldingIdentifierInput,
  ): Promise<Holding> {
    const holding = await this.getManualHoldingOrThrow(userId, input);
    const quote = await this.marketDataService.getQuote(
      input.market,
      input.symbol,
    );

    return this.prisma.holding.update({
      where: { id: holding.id },
      data: {
        currentPrice: quote.price,
        marketValue: holding.quantity * quote.price,
        name: quote.name,
        currency: quote.currency,
        lastUpdated: quote.lastUpdated,
      },
    });
  }
}
