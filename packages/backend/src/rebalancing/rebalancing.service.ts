import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  RebalancingGroup,
  RebalancingAnalysis,
  TagAllocation,
  InvestmentRecommendation,
} from './rebalancing.entities';
import {
  CreateRebalancingGroupInput,
  UpdateRebalancingGroupInput,
  SetTargetAllocationsInput,
  CalculateInvestmentInput,
} from './rebalancing.dto';
import { BrokerageService } from '../brokerage/brokerage.service';
import { HoldingsService } from '../holdings/holdings.service';

const PERCENTAGE_TOLERANCE = 0.01;

type GroupWithTags = Prisma.RebalancingGroupGetPayload<{
  include: { tags: true };
}>;

@Injectable()
export class RebalancingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly brokerageService: BrokerageService,
    private readonly holdingsService: HoldingsService,
  ) {}

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
      (sum, target) => sum + target.targetPercentage,
      0,
    );
    if (
      input.targets.length > 0 &&
      Math.abs(totalPercentage - 100) > PERCENTAGE_TOLERANCE
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

    const allHoldings = await this.brokerageService.getHoldings(userId);
    const targetAllocations = await this.prisma.targetAllocation.findMany({
      where: { groupId },
    });
    const targetMap = new Map(
      targetAllocations.map((target) => [
        target.tagId,
        target.targetPercentage,
      ]),
    );

    const allocations: TagAllocation[] = [];
    let totalValue = 0;
    const holdingsByTag = new Map<string, string[]>();
    const marketValueBySymbol = new Map<string, number>();
    const tagValueByTag = new Map<string, number>();

    for (const holding of allHoldings) {
      const currentValue = marketValueBySymbol.get(holding.symbol) ?? 0;
      marketValueBySymbol.set(
        holding.symbol,
        currentValue + holding.marketValue,
      );
    }

    for (const tagId of groupTagIds) {
      const holdingsForTag = await this.holdingsService.getHoldingsForTag(
        userId,
        tagId,
      );
      holdingsByTag.set(tagId, holdingsForTag);
      const tagValue = holdingsForTag.reduce((sum, symbol) => {
        return sum + (marketValueBySymbol.get(symbol) ?? 0);
      }, 0);
      tagValueByTag.set(tagId, tagValue);
      totalValue += tagValue;
    }

    for (const tagId of groupTagIds) {
      const tag = tagMap.get(tagId);
      if (!tag) {
        continue;
      }

      const holdingsForTag = holdingsByTag.get(tagId) ?? [];
      const tagValue =
        tagValueByTag.get(tagId) ??
        holdingsForTag.reduce((sum, symbol) => {
          return sum + (marketValueBySymbol.get(symbol) ?? 0);
        }, 0);

      const currentPercentage =
        totalValue > 0 ? (tagValue / totalValue) * 100 : 0;
      const targetPercentage = targetMap.get(tagId) ?? 0;
      const difference = targetPercentage - currentPercentage;

      allocations.push({
        tagId,
        tagName: tag.name,
        tagColor: tag.color,
        currentValue: tagValue,
        currentPercentage,
        targetPercentage,
        difference,
      });
    }

    return {
      groupId,
      groupName: group.name,
      totalValue,
      allocations,
      lastUpdated: new Date(),
    };
  }

  async calculateInvestmentRecommendation(
    userId: string,
    input: CalculateInvestmentInput,
  ): Promise<InvestmentRecommendation[]> {
    const analysis = await this.getRebalancingAnalysis(userId, input.groupId);
    const newTotalValue = analysis.totalValue + input.investmentAmount;

    const recommendations: InvestmentRecommendation[] = [];

    for (const allocation of analysis.allocations) {
      const targetValue = (allocation.targetPercentage / 100) * newTotalValue;
      const neededValue = targetValue - allocation.currentValue;
      const recommendedAmount = Math.max(0, neededValue);
      const recommendedPercentage =
        input.investmentAmount > 0
          ? (recommendedAmount / input.investmentAmount) * 100
          : 0;
      const suggestedSymbols = await this.holdingsService.getHoldingsForTag(
        userId,
        allocation.tagId,
      );

      recommendations.push({
        tagId: allocation.tagId,
        tagName: allocation.tagName,
        recommendedAmount,
        recommendedPercentage,
        suggestedSymbols,
      });
    }

    return recommendations;
  }
}
