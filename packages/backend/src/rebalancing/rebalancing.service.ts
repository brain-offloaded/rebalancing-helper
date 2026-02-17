import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Decimal, DecimalInput } from '@rebalancing-helper/common';
import { createDecimal } from '@rebalancing-helper/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  RebalancingGroup,
  RebalancingAnalysis,
  TagAllocation,
  InvestmentRecommendation,
  RecommendationSymbolQuote,
} from './rebalancing.entities';
import {
  CreateRebalancingGroupInput,
  UpdateRebalancingGroupInput,
  SetTargetAllocationsInput,
  CalculateInvestmentInput,
  AddTagsToRebalancingGroupInput,
  RemoveTagsFromRebalancingGroupInput,
  RenameRebalancingGroupInput,
} from './rebalancing.dto';
import { HoldingsService } from '../holdings/holdings.service';
import { CurrencyConversionService } from '../yahoo/currency-conversion.service';
import { TypedConfigService } from '../typed-config';

const PERCENTAGE_TOLERANCE = createDecimal('0.01');
const ONE_HUNDRED = createDecimal(100);
const ONE = createDecimal(1);

type GroupWithTags = Prisma.RebalancingGroupGetPayload<{
  include: { tags: true };
}>;

@Injectable()
export class RebalancingService {
  private readonly logger = new Logger(RebalancingService.name);
  private readonly baseCurrency: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly holdingsService: HoldingsService,
    private readonly currencyConversionService: CurrencyConversionService,
    private readonly configService: TypedConfigService,
  ) {
    this.baseCurrency = this.configService.get('BASE_CURRENCY').toUpperCase();
  }

  private toDecimal(value: DecimalInput): Decimal {
    return createDecimal(value);
  }

  private toNumber(value: Decimal): number {
    return value.toNumber();
  }

  private clampToZero(value: Decimal): Decimal {
    return value.isNegative() ? createDecimal(0) : value;
  }

  private async getConversionRates(
    currencies: Iterable<string>,
    baseCurrency: string,
  ): Promise<Map<string, Decimal>> {
    const conversionRates = new Map<string, Decimal>();

    for (const rawCurrency of currencies) {
      const currency = rawCurrency.toUpperCase();
      if (currency === baseCurrency || conversionRates.has(currency)) {
        continue;
      }

      try {
        const rate = await this.currencyConversionService.getRate(
          currency,
          baseCurrency,
        );
        conversionRates.set(currency, rate);
      } catch (error: unknown) {
        this.logger.warn(
          `환율 정보를 가져오지 못했습니다 (${currency}->${baseCurrency}): ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
        conversionRates.set(currency, ONE);
      }
    }

    return conversionRates;
  }

  private async getUnitPriceBySymbolInBaseCurrency(
    userId: string,
    baseCurrency: string,
  ): Promise<Map<string, Decimal>> {
    const holdings = await this.holdingsService.getHoldings(userId);
    const latestHoldingBySymbol = new Map<
      string,
      { currentPrice: Decimal; currency: string; lastTradedAt: Date }
    >();

    for (const holding of holdings) {
      const currency = (holding.currency ?? baseCurrency).toUpperCase();
      const current = {
        currentPrice: this.toDecimal(holding.currentPrice),
        currency,
        lastTradedAt: holding.lastTradedAt,
      };
      const existing = latestHoldingBySymbol.get(holding.symbol);

      if (
        !existing ||
        current.lastTradedAt.getTime() >= existing.lastTradedAt.getTime()
      ) {
        latestHoldingBySymbol.set(holding.symbol, current);
      }
    }

    const conversionRates = await this.getConversionRates(
      Array.from(latestHoldingBySymbol.values()).map((item) => item.currency),
      baseCurrency,
    );
    const unitPriceBySymbol = new Map<string, Decimal>();

    for (const [symbol, holding] of latestHoldingBySymbol) {
      const rate =
        holding.currency === baseCurrency
          ? ONE
          : (conversionRates.get(holding.currency) ?? ONE);

      unitPriceBySymbol.set(symbol, holding.currentPrice.times(rate));
    }

    return unitPriceBySymbol;
  }

  private async assertTagsBelongToUser(
    userId: string,
    tagIds: string[],
  ): Promise<void> {
    if (tagIds.length === 0) {
      return;
    }

    const uniqueTagIds = Array.from(new Set(tagIds));
    const count = await this.prisma.tag.count({
      where: {
        id: { in: uniqueTagIds },
        userId,
      },
    });

    if (count !== uniqueTagIds.length) {
      throw new NotFoundException('One or more tags were not found');
    }
  }

  private async getGroupForUser(
    userId: string,
    groupId: string,
  ): Promise<GroupWithTags> {
    const group = await this.prisma.rebalancingGroup.findFirst({
      where: { id: groupId, userId },
      include: { tags: true },
    });

    if (!group) {
      throw new NotFoundException('Rebalancing group not found');
    }

    return group;
  }

  private mapGroup(group: GroupWithTags): RebalancingGroup {
    return {
      id: group.id,
      name: group.name,
      description: group.description,
      tagIds: group.tags.map((tag) => tag.tagId),
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
    };
  }

  async createGroup(
    userId: string,
    input: CreateRebalancingGroupInput,
  ): Promise<RebalancingGroup> {
    const uniqueTagIds = Array.from(new Set(input.tagIds));
    await this.assertTagsBelongToUser(userId, uniqueTagIds);

    const data: Prisma.RebalancingGroupCreateInput = {
      name: input.name,
      description: input.description ?? null,
      user: {
        connect: { id: userId },
      },
      tags: {
        create: uniqueTagIds.map((tagId) => ({
          tag: {
            connect: { id: tagId },
          },
        })),
      },
    };

    const group = await this.prisma.rebalancingGroup.create({
      data,
      include: { tags: true },
    });

    return this.mapGroup(group);
  }

  async updateGroup(
    userId: string,
    input: UpdateRebalancingGroupInput,
  ): Promise<RebalancingGroup> {
    const uniqueTagIds = input.tagIds
      ? Array.from(new Set(input.tagIds))
      : undefined;

    const data: Prisma.RebalancingGroupUpdateInput = {};

    await this.getGroupForUser(userId, input.id);

    if (input.name !== undefined) {
      data.name = input.name;
    }

    if (input.description !== undefined) {
      data.description = input.description ?? null;
    }

    if (uniqueTagIds) {
      await this.assertTagsBelongToUser(userId, uniqueTagIds);
      data.tags = {
        deleteMany: {},
        create: uniqueTagIds.map((tagId) => ({
          tag: {
            connect: { id: tagId },
          },
        })),
      };
    }

    const updatedGroup = await this.prisma.rebalancingGroup.update({
      where: { id: input.id },
      data,
      include: { tags: true },
    });

    return this.mapGroup(updatedGroup);
  }

  async deleteGroup(userId: string, id: string): Promise<boolean> {
    try {
      await this.getGroupForUser(userId, id);
      await this.prisma.rebalancingGroup.delete({ where: { id } });
      return true;
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        return false;
      }
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        return false;
      }
      throw error;
    }
  }

  async getGroups(userId: string): Promise<RebalancingGroup[]> {
    const groups = await this.prisma.rebalancingGroup.findMany({
      where: { userId },
      include: { tags: true },
      orderBy: { createdAt: 'asc' },
    });

    return groups.map((group) => this.mapGroup(group));
  }

  async getGroup(userId: string, id: string): Promise<RebalancingGroup | null> {
    const group = await this.prisma.rebalancingGroup.findFirst({
      where: { id, userId },
      include: { tags: true },
    });

    return group ? this.mapGroup(group) : null;
  }

  async setTargetAllocations(
    userId: string,
    input: SetTargetAllocationsInput,
  ): Promise<boolean> {
    const group = await this.getGroupForUser(userId, input.groupId);

    const groupTagIds = group.tags.map((tag) => tag.tagId);
    const totalPercentage = input.targets.reduce(
      (sum, target) => sum.plus(this.toDecimal(target.targetPercentage)),
      createDecimal(0),
    );
    if (
      input.targets.length > 0 &&
      totalPercentage.minus(ONE_HUNDRED).abs().greaterThan(PERCENTAGE_TOLERANCE)
    ) {
      throw new BadRequestException('Target percentages must sum to 100');
    }

    const invalidTags = input.targets.filter(
      (target) => !groupTagIds.includes(target.tagId),
    );
    if (invalidTags.length > 0) {
      throw new BadRequestException(
        `Invalid tags: ${invalidTags.map((t) => t.tagId).join(', ')}`,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.targetAllocation.deleteMany({
        where: { groupId: input.groupId },
      });
      if (input.targets.length > 0) {
        await tx.targetAllocation.createMany({
          data: input.targets.map((target) => ({
            groupId: input.groupId,
            tagId: target.tagId,
            targetPercentage: target.targetPercentage,
          })),
        });
      }
    });

    return true;
  }

  async addTagsToGroup(
    userId: string,
    input: AddTagsToRebalancingGroupInput,
  ): Promise<RebalancingGroup> {
    const group = await this.getGroupForUser(userId, input.groupId);
    const existingTagIds = new Set(group.tags.map((tag) => tag.tagId));
    const requestedTagIds = Array.from(new Set(input.tagIds));
    const newTagIds = requestedTagIds.filter((tagId) => {
      return !existingTagIds.has(tagId);
    });

    if (newTagIds.length === 0) {
      return this.mapGroup(group);
    }

    await this.assertTagsBelongToUser(userId, newTagIds);
    await this.prisma.rebalancingGroupTag.createMany({
      data: newTagIds.map((tagId) => ({
        groupId: input.groupId,
        tagId,
      })),
    });

    const updatedGroup = await this.getGroupForUser(userId, input.groupId);
    return this.mapGroup(updatedGroup);
  }

  async removeTagsFromGroup(
    userId: string,
    input: RemoveTagsFromRebalancingGroupInput,
  ): Promise<RebalancingGroup> {
    const group = await this.getGroupForUser(userId, input.groupId);
    const existingTagIds = new Set(group.tags.map((tag) => tag.tagId));
    const tagsToRemove = Array.from(new Set(input.tagIds)).filter((tagId) =>
      existingTagIds.has(tagId),
    );

    if (tagsToRemove.length === 0) {
      return this.mapGroup(group);
    }

    await this.prisma.rebalancingGroupTag.deleteMany({
      where: { groupId: input.groupId, tagId: { in: tagsToRemove } },
    });
    await this.prisma.targetAllocation.deleteMany({
      where: { groupId: input.groupId, tagId: { in: tagsToRemove } },
    });

    const updatedGroup = await this.getGroupForUser(userId, input.groupId);
    return this.mapGroup(updatedGroup);
  }

  async renameGroup(
    userId: string,
    input: RenameRebalancingGroupInput,
  ): Promise<RebalancingGroup> {
    await this.getGroupForUser(userId, input.groupId);
    const updatedGroup = await this.prisma.rebalancingGroup.update({
      where: { id: input.groupId },
      data: { name: input.name },
      include: { tags: true },
    });

    return this.mapGroup(updatedGroup);
  }

  async getRebalancingAnalysis(
    userId: string,
    groupId: string,
  ): Promise<RebalancingAnalysis> {
    const group = await this.getGroupForUser(userId, groupId);

    const groupTagIds = group.tags.map((tag) => tag.tagId);
    const tags = await this.prisma.tag.findMany({
      where: { id: { in: groupTagIds }, userId },
    });
    const tagMap = new Map(tags.map((tag) => [tag.id, tag]));

    const holdings = await this.holdingsService.getHoldings(userId);

    const holdingsForValue = holdings.map((holding) => ({
      symbol: holding.symbol,
      marketValue: this.toDecimal(holding.marketValue),
      currency: (holding.currency ?? this.baseCurrency).toUpperCase(),
    }));
    const targetAllocations = await this.prisma.targetAllocation.findMany({
      where: { groupId },
    });
    const targetMap = new Map<string, Decimal>(
      targetAllocations.map((target) => [
        target.tagId,
        this.toDecimal(target.targetPercentage),
      ]),
    );

    const allocations: TagAllocation[] = [];
    let totalValue = createDecimal(0);
    const holdingsByTag = new Map<string, string[]>();
    const marketValueBySymbol = new Map<string, Decimal>();
    const tagValueByTag = new Map<string, Decimal>();

    const currenciesToConvert = new Set<string>();
    for (const holding of holdingsForValue) {
      if (holding.currency !== this.baseCurrency) {
        currenciesToConvert.add(holding.currency);
      }
    }

    const conversionRates = await this.getConversionRates(
      currenciesToConvert,
      this.baseCurrency,
    );

    for (const holding of holdingsForValue) {
      const currentValue =
        marketValueBySymbol.get(holding.symbol) ?? createDecimal(0);
      const rate =
        holding.currency === this.baseCurrency
          ? ONE
          : (conversionRates.get(holding.currency) ?? ONE);
      const convertedValue = holding.marketValue.times(rate);
      marketValueBySymbol.set(
        holding.symbol,
        currentValue.plus(convertedValue),
      );
    }

    for (const tagId of groupTagIds) {
      const holdingsForTag = await this.holdingsService.getHoldingsForTag(
        userId,
        tagId,
      );
      holdingsByTag.set(tagId, holdingsForTag);
      const tagValue = holdingsForTag.reduce((sum, symbol) => {
        const value = marketValueBySymbol.get(symbol);
        return value ? sum.plus(value) : sum;
      }, createDecimal(0));
      tagValueByTag.set(tagId, tagValue);
      totalValue = totalValue.plus(tagValue);
    }

    for (const tagId of groupTagIds) {
      const tag = tagMap.get(tagId);
      if (!tag) {
        continue;
      }

      const tagValue = tagValueByTag.get(tagId) ?? createDecimal(0);

      const currentPercentage = totalValue.isZero()
        ? createDecimal(0)
        : tagValue.dividedBy(totalValue).times(ONE_HUNDRED);
      const targetPercentage = targetMap.get(tagId) ?? createDecimal(0);
      const difference = targetPercentage.minus(currentPercentage);

      allocations.push({
        tagId,
        tagName: tag.name,
        tagColor: tag.color,
        currentValue: this.toNumber(tagValue),
        currentPercentage: this.toNumber(currentPercentage),
        targetPercentage: this.toNumber(targetPercentage),
        difference: this.toNumber(difference),
      });
    }

    return {
      groupId,
      groupName: group.name,
      totalValue: this.toNumber(totalValue),
      baseCurrency: this.baseCurrency,
      allocations,
      lastUpdated: new Date(),
    };
  }

  async calculateInvestmentRecommendation(
    userId: string,
    input: CalculateInvestmentInput,
  ): Promise<InvestmentRecommendation[]> {
    const analysis = await this.getRebalancingAnalysis(userId, input.groupId);
    const investmentBudget = this.toDecimal(input.investmentAmount);
    const newTotalValue = this.toDecimal(analysis.totalValue).plus(
      investmentBudget,
    );

    const allocationNeeds = analysis.allocations.map((allocation) => {
      const targetValue = this.toDecimal(allocation.targetPercentage)
        .dividedBy(ONE_HUNDRED)
        .times(newTotalValue);
      const currentValue = this.toDecimal(allocation.currentValue);
      const neededValue = targetValue.minus(currentValue);
      const positiveNeeded = neededValue.greaterThan(0)
        ? neededValue
        : createDecimal(0);
      return { allocation, neededValue: positiveNeeded };
    });

    const totalNeededValue = allocationNeeds.reduce(
      (sum, item) => sum.plus(item.neededValue),
      createDecimal(0),
    );

    const recommendations: InvestmentRecommendation[] = [];
    let remainingAmount = investmentBudget;
    const unitPriceBySymbol = await this.getUnitPriceBySymbolInBaseCurrency(
      userId,
      analysis.baseCurrency,
    );

    for (let index = 0; index < allocationNeeds.length; index++) {
      const { allocation, neededValue } = allocationNeeds[index];
      let recommendedAmount = createDecimal(0);

      if (neededValue.greaterThan(0) && !investmentBudget.isZero()) {
        if (totalNeededValue.lessThanOrEqualTo(investmentBudget)) {
          recommendedAmount = neededValue.lessThan(remainingAmount)
            ? neededValue
            : remainingAmount;
        } else {
          const proportion = neededValue.dividedBy(totalNeededValue);
          recommendedAmount = proportion.times(investmentBudget);
          if (index === allocationNeeds.length - 1) {
            recommendedAmount = remainingAmount;
          } else {
            recommendedAmount = recommendedAmount.lessThan(remainingAmount)
              ? recommendedAmount
              : remainingAmount;
          }
        }
      }

      remainingAmount = this.clampToZero(
        remainingAmount.minus(recommendedAmount),
      );

      const recommendedPercentage = investmentBudget.isZero()
        ? createDecimal(0)
        : recommendedAmount.dividedBy(investmentBudget).times(ONE_HUNDRED);
      const suggestedSymbols = await this.holdingsService.getHoldingsForTag(
        userId,
        allocation.tagId,
      );
      const symbolQuotes: RecommendationSymbolQuote[] = suggestedSymbols.map(
        (symbol) => {
          const unitPrice = unitPriceBySymbol.get(symbol);

          return {
            symbol,
            unitPriceInBaseCurrency: unitPrice ? this.toNumber(unitPrice) : 0,
            baseCurrency: analysis.baseCurrency,
            priceAvailable: Boolean(unitPrice),
          };
        },
      );

      recommendations.push({
        tagId: allocation.tagId,
        tagName: allocation.tagName,
        recommendedAmount: this.toNumber(recommendedAmount),
        recommendedPercentage: this.toNumber(recommendedPercentage),
        suggestedSymbols,
        symbolQuotes,
        baseCurrency: analysis.baseCurrency,
      });
    }

    return recommendations;
  }
}
