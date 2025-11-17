import { Injectable, NotFoundException } from '@nestjs/common';
import {
  HoldingSource as PrismaHoldingSource,
  Prisma,
  Holding as PrismaHolding,
  HoldingAccount as PrismaHoldingAccount,
  HoldingAccountSyncMode as PrismaHoldingAccountSyncMode,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { HoldingTag, Holding, HoldingSource } from './holdings.entities';
import { Decimal } from '@prisma/client/runtime/library';
import {
  AddHoldingTagInput,
  RemoveHoldingTagInput,
  SetHoldingTagsInput,
  CreateManualHoldingInput,
  IncreaseManualHoldingInput,
  SetManualHoldingQuantityInput,
  ManualHoldingIdentifierInput,
  SetHoldingAliasInput,
} from './holdings.dto';
import { MarketDataService } from './market-data.service';
import { PrismaDecimalService } from '../prisma/prisma-decimal.service';

@Injectable()
export class HoldingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly prismaDecimalService: PrismaDecimalService,
    private readonly marketDataService: MarketDataService,
  ) {}

  private mapHolding(holding: PrismaHolding): Holding {
    const { quantity, currentPrice, marketValue, source, ...rest } = holding;

    return {
      ...rest,
      source: source as HoldingSource,
      quantity: this.toNumber(quantity),
      currentPrice: this.toNumber(currentPrice),
      marketValue: this.toNumber(marketValue),
    };
  }

  private toDecimal(value: Decimal | number | string): Decimal {
    if (typeof (value as Decimal).toNumber === 'function') {
      return value as Decimal;
    }

    return new Decimal(value as Decimal.Value);
  }

  private toNumber(value: Decimal | number): number {
    return typeof value === 'number' ? value : value.toNumber();
  }

  private mapHoldings(holdings: PrismaHolding[]): Holding[] {
    return holdings.map((holding) => this.mapHolding(holding));
  }

  private async getAccountOrThrow(
    userId: string,
    accountId: string,
  ): Promise<PrismaHoldingAccount> {
    const account = await this.prisma.holdingAccount.findFirst({
      where: { id: accountId, userId },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    return account;
  }

  private async getManualAccountOrThrow(
    userId: string,
    accountId: string,
  ): Promise<PrismaHoldingAccount> {
    const account = await this.getAccountOrThrow(userId, accountId);

    if (account.syncMode !== PrismaHoldingAccountSyncMode.MANUAL) {
      throw new NotFoundException('Manual account not found');
    }

    return account;
  }

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
    await this.getManualAccountOrThrow(userId, identifier.accountId);

    const holding = await this.prisma.holding.findFirst({
      where: {
        userId,
        accountId: identifier.accountId,
        market: identifier.market,
        symbol: identifier.symbol,
        source: PrismaHoldingSource.MANUAL,
      },
    });

    if (!holding) {
      throw new NotFoundException('Holding not found');
    }

    return holding;
  }

  private async getHoldingByIdOrThrow(userId: string, holdingId: string) {
    const holding = await this.prisma.holding.findFirst({
      where: { id: holdingId, userId },
    });

    if (!holding) {
      throw new NotFoundException('Holding not found');
    }

    return holding;
  }

  async getHoldings(
    userId: string,
    options: {
      source?: PrismaHoldingSource;
      accountId?: string;
    } = {},
  ): Promise<Holding[]> {
    if (options.accountId) {
      await this.getAccountOrThrow(userId, options.accountId);
    }

    const where: Prisma.HoldingWhereInput = {
      userId,
      ...(options.source ? { source: options.source } : {}),
      ...(options.accountId ? { accountId: options.accountId } : {}),
    };

    const orderBy: Prisma.HoldingOrderByWithRelationInput[] =
      options.source === PrismaHoldingSource.MANUAL
        ? [{ market: Prisma.SortOrder.asc }, { symbol: Prisma.SortOrder.asc }]
        : [{ symbol: Prisma.SortOrder.asc }, { market: Prisma.SortOrder.asc }];

    const results = await this.prisma.holding.findMany({
      where,
      orderBy,
    });

    return this.mapHoldings(results);
  }

  getManualHoldings(userId: string): Promise<Holding[]> {
    return this.getHoldings(userId, { source: PrismaHoldingSource.MANUAL });
  }

  async createManualHolding(
    userId: string,
    input: CreateManualHoldingInput,
  ): Promise<Holding> {
    await this.getManualAccountOrThrow(userId, input.accountId);

    const quote = await this.marketDataService.getQuote(
      input.market,
      input.symbol,
    );

    const quantityDecimal =
      this.prismaDecimalService.decimalInputToPrismaDecimal(input.quantity);
    const priceDecimal = this.prismaDecimalService.decimalInputToPrismaDecimal(
      quote.price,
    );
    const marketValueDecimal = quantityDecimal.mul(priceDecimal);

    const created = await this.prisma.holding.create({
      data: {
        userId,
        source: PrismaHoldingSource.MANUAL,
        accountId: input.accountId,
        market: quote.market,
        symbol: quote.symbol,
        name: quote.name,
        quantity: quantityDecimal.toNumber(),
        currentPrice: priceDecimal.toNumber(),
        marketValue: marketValueDecimal.toNumber(),
        currency: quote.currency,
        lastTradedAt: new Date(),
      },
    });

    return this.mapHolding(created);
  }

  async increaseManualHolding(
    userId: string,
    input: IncreaseManualHoldingInput,
  ): Promise<Holding> {
    const holding = await this.getManualHoldingOrThrow(userId, input);
    const currentQuantity =
      this.prismaDecimalService.decimalInputToPrismaDecimal(holding.quantity);
    const delta = this.prismaDecimalService.decimalInputToPrismaDecimal(
      input.quantityDelta,
    );
    const nextQuantity = currentQuantity.add(delta);
    const marketValue = this.prismaDecimalService
      .decimalInputToPrismaDecimal(holding.currentPrice)
      .mul(nextQuantity);

    const updated = await this.prisma.holding.update({
      where: { id: holding.id },
      data: {
        quantity: nextQuantity.toNumber(),
        marketValue: marketValue.toNumber(),
        lastTradedAt: new Date(),
      },
    });

    return this.mapHolding(updated);
  }

  async setManualHoldingQuantity(
    userId: string,
    input: SetManualHoldingQuantityInput,
  ): Promise<Holding> {
    const holding = await this.getManualHoldingOrThrow(userId, input);
    const quantityDecimal =
      this.prismaDecimalService.decimalInputToPrismaDecimal(input.quantity);
    const marketValue = this.prismaDecimalService
      .decimalInputToPrismaDecimal(holding.currentPrice)
      .mul(quantityDecimal);

    const updated = await this.prisma.holding.update({
      where: { id: holding.id },
      data: {
        quantity: quantityDecimal.toNumber(),
        marketValue: marketValue.toNumber(),
        lastTradedAt: new Date(),
      },
    });

    return this.mapHolding(updated);
  }

  async deleteManualHolding(
    userId: string,
    input: ManualHoldingIdentifierInput,
  ): Promise<boolean> {
    try {
      const holding = await this.getManualHoldingOrThrow(userId, input);

      await this.prisma.holding.delete({
        where: { id: holding.id },
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

    const quantityDecimal =
      this.prismaDecimalService.decimalInputToPrismaDecimal(holding.quantity);
    const priceDecimal = this.prismaDecimalService.decimalInputToPrismaDecimal(
      quote.price,
    );
    const marketValue = quantityDecimal.mul(priceDecimal);

    const updated = await this.prisma.holding.update({
      where: { id: holding.id },
      data: {
        currentPrice: priceDecimal.toNumber(),
        marketValue: marketValue.toNumber(),
        name: quote.name,
        currency: quote.currency,
        // Price sync should not mutate trade timestamp
      },
    });

    return this.mapHolding(updated);
  }

  async setHoldingAlias(
    userId: string,
    input: SetHoldingAliasInput,
  ): Promise<Holding> {
    const holding = await this.getHoldingByIdOrThrow(userId, input.holdingId);

    const trimmedAlias = input.alias?.trim();
    const normalizedAlias = trimmedAlias ? trimmedAlias : null;

    const updated = await this.prisma.holding.update({
      where: { id: holding.id },
      data: { alias: normalizedAlias },
    });

    return this.mapHolding(updated);
  }
}
