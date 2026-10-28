import { Injectable, NotFoundException } from '@nestjs/common';
import {
  HoldingSource as PrismaHoldingSource,
  Prisma,
  Holding as PrismaHolding,
  HoldingAccount as PrismaHoldingAccount,
  HoldingAccountSyncMode as PrismaHoldingAccountSyncMode,
  SecurityAlias as PrismaSecurityAlias,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  HoldingTag,
  Holding,
  HoldingSource,
  SecurityAlias,
} from './holdings.entities';
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
  SetSecurityAliasInput,
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

  private normalizeMarketKey(market?: string | null): string {
    return market?.trim().toUpperCase() ?? '';
  }

  private normalizeSymbol(symbol: string): string {
    return symbol.trim().toUpperCase();
  }

  private getSecurityAliasKey(
    market: string | null | undefined,
    symbol: string,
  ) {
    return `${this.normalizeMarketKey(market)}:${this.normalizeSymbol(symbol)}`;
  }

  private mapSecurityAlias(alias: PrismaSecurityAlias): SecurityAlias {
    return {
      id: alias.id,
      market: alias.market.length > 0 ? alias.market : null,
      symbol: alias.symbol,
      alias: alias.alias,
      createdAt: alias.createdAt,
      updatedAt: alias.updatedAt,
    };
  }

  private mapHolding(
    holding: PrismaHolding,
    aliasOverride?: string | null,
  ): Holding {
    const { quantity, currentPrice, marketValue, source, ...rest } = holding;

    return {
      ...rest,
      source: source as HoldingSource,
      alias: aliasOverride ?? null,
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

  private mapHoldings(
    holdings: PrismaHolding[],
    aliasBySecurity = new Map<string, string>(),
  ): Holding[] {
    return holdings.map((holding) =>
      this.mapHolding(
        holding,
        aliasBySecurity.get(
          this.getSecurityAliasKey(holding.market, holding.symbol),
        ) ?? null,
      ),
    );
  }

  private async getSecurityAliasMapForHoldings(
    userId: string,
    holdings: PrismaHolding[],
  ): Promise<Map<string, string>> {
    if (holdings.length === 0) {
      return new Map();
    }

    const aliases = await this.prisma.securityAlias.findMany({
      where: { userId },
    });

    return new Map(
      aliases.map((alias) => [
        this.getSecurityAliasKey(alias.market, alias.symbol),
        alias.alias,
      ]),
    );
  }

  private async getAliasForHolding(
    userId: string,
    holding: PrismaHolding,
  ): Promise<string | null> {
    const alias = await this.prisma.securityAlias.findUnique({
      where: {
        user_market_symbol: {
          userId,
          market: this.normalizeMarketKey(holding.market),
          symbol: this.normalizeSymbol(holding.symbol),
        },
      },
    });

    return alias?.alias ?? null;
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
    const aliasBySecurity = await this.getSecurityAliasMapForHoldings(
      userId,
      results,
    );

    return this.mapHoldings(results, aliasBySecurity);
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

    return this.mapHolding(
      created,
      await this.getAliasForHolding(userId, created),
    );
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

    return this.mapHolding(
      updated,
      await this.getAliasForHolding(userId, updated),
    );
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

    return this.mapHolding(
      updated,
      await this.getAliasForHolding(userId, updated),
    );
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

    return this.mapHolding(
      updated,
      await this.getAliasForHolding(userId, updated),
    );
  }

  async setHoldingAlias(
    userId: string,
    input: SetHoldingAliasInput,
  ): Promise<Holding> {
    const holding = await this.getHoldingByIdOrThrow(userId, input.holdingId);
    return this.setSecurityAliasForHolding(userId, holding, input.alias);
  }

  async getSecurityAliases(userId: string): Promise<SecurityAlias[]> {
    const aliases = await this.prisma.securityAlias.findMany({
      where: { userId },
      orderBy: [{ symbol: 'asc' }, { market: 'asc' }],
    });

    return aliases.map((alias) => this.mapSecurityAlias(alias));
  }

  async setSecurityAlias(
    userId: string,
    input: SetSecurityAliasInput,
  ): Promise<SecurityAlias | null> {
    const market = this.normalizeMarketKey(input.market);
    const symbol = this.normalizeSymbol(input.symbol);
    const trimmedAlias = input.alias?.trim();
    const normalizedAlias = trimmedAlias ? trimmedAlias : null;

    if (!normalizedAlias) {
      await this.prisma.securityAlias.deleteMany({
        where: { userId, market, symbol },
      });
      return null;
    }

    const alias = await this.prisma.securityAlias.upsert({
      where: {
        user_market_symbol: {
          userId,
          market,
          symbol,
        },
      },
      update: { alias: normalizedAlias },
      create: {
        userId,
        market,
        symbol,
        alias: normalizedAlias,
      },
    });

    return this.mapSecurityAlias(alias);
  }

  private async setSecurityAliasForHolding(
    userId: string,
    holding: PrismaHolding,
    alias: string | null,
  ): Promise<Holding> {
    await this.setSecurityAlias(userId, {
      market: holding.market,
      symbol: holding.symbol,
      alias,
    });

    return this.mapHolding(holding, alias?.trim() || null);
  }
}
