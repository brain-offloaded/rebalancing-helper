import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { HoldingTag, ManualHolding } from './holdings.entities';
import {
  AddHoldingTagInput,
  RemoveHoldingTagInput,
  SetHoldingTagsInput,
  CreateManualHoldingInput,
  IncreaseManualHoldingInput,
  SetManualHoldingQuantityInput,
  ManualHoldingIdentifierInput,
} from './holdings.dto';

@Injectable()
export class HoldingsService {
  constructor(private readonly prisma: PrismaService) {}

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

  private async getMarketSecurityOrThrow(market: string, symbol: string) {
    const security = await this.prisma.marketSecurity.findUnique({
      where: {
        market_symbol: {
          market,
          symbol,
        },
      },
    });

    if (!security) {
      throw new NotFoundException('Market security not found');
    }

    return security;
  }

  private async getManualHoldingOrThrow(
    userId: string,
    identifier: ManualHoldingIdentifierInput,
  ) {
    const holding = await this.prisma.manualHolding.findUnique({
      where: {
        userId_market_symbol: {
          userId,
          market: identifier.market,
          symbol: identifier.symbol,
        },
      },
    });

    if (!holding) {
      throw new NotFoundException('Manual holding not found');
    }

    return holding;
  }

  getManualHoldings(userId: string): Promise<ManualHolding[]> {
    return this.prisma.manualHolding.findMany({
      where: { userId },
      orderBy: [{ market: 'asc' }, { symbol: 'asc' }],
    });
  }

  async createManualHolding(
    userId: string,
    input: CreateManualHoldingInput,
  ): Promise<ManualHolding> {
    const security = await this.getMarketSecurityOrThrow(
      input.market,
      input.symbol,
    );

    return this.prisma.manualHolding.create({
      data: {
        userId,
        market: input.market,
        symbol: input.symbol,
        name: security.name,
        quantity: input.quantity,
        currentPrice: security.currentPrice,
        marketValue: input.quantity * security.currentPrice,
        currency: security.currency,
        lastUpdated: security.lastUpdated,
      },
    });
  }

  async increaseManualHolding(
    userId: string,
    input: IncreaseManualHoldingInput,
  ): Promise<ManualHolding> {
    const holding = await this.getManualHoldingOrThrow(userId, input);
    const nextQuantity = holding.quantity + input.quantityDelta;

    return this.prisma.manualHolding.update({
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
  ): Promise<ManualHolding> {
    const holding = await this.getManualHoldingOrThrow(userId, input);

    return this.prisma.manualHolding.update({
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
      await this.prisma.manualHolding.delete({
        where: {
          userId_market_symbol: {
            userId,
            market: input.market,
            symbol: input.symbol,
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
  ): Promise<ManualHolding> {
    const holding = await this.getManualHoldingOrThrow(userId, input);
    const security = await this.getMarketSecurityOrThrow(
      input.market,
      input.symbol,
    );

    return this.prisma.manualHolding.update({
      where: { id: holding.id },
      data: {
        currentPrice: security.currentPrice,
        marketValue: holding.quantity * security.currentPrice,
        name: security.name,
        currency: security.currency,
        lastUpdated: security.lastUpdated,
      },
    });
  }
}
