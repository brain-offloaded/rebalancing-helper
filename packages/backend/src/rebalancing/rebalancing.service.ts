import { Injectable } from '@nestjs/common';
import { RebalancingGroup, RebalancingAnalysis, TagAllocation, InvestmentRecommendation } from './rebalancing.entities';
import { CreateRebalancingGroupInput, UpdateRebalancingGroupInput, SetTargetAllocationsInput, CalculateInvestmentInput } from './rebalancing.dto';
import { BrokerageService } from '../brokerage/brokerage.service';
import { HoldingsService } from '../holdings/holdings.service';
import { TagsService } from '../tags/tags.service';

@Injectable()
export class RebalancingService {
  private groups: RebalancingGroup[] = [];
  private targetAllocations: Map<string, Map<string, number>> = new Map(); // groupId -> tagId -> percentage

  constructor(
    private readonly brokerageService: BrokerageService,
    private readonly holdingsService: HoldingsService,
    private readonly tagsService: TagsService,
  ) {}

  async createGroup(input: CreateRebalancingGroupInput): Promise<RebalancingGroup> {
    const group: RebalancingGroup = {
      id: Date.now().toString(),
      name: input.name,
      description: input.description,
      tagIds: input.tagIds,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.groups.push(group);
    return group;
  }

  async updateGroup(input: UpdateRebalancingGroupInput): Promise<RebalancingGroup> {
    const groupIndex = this.groups.findIndex(group => group.id === input.id);
    if (groupIndex === -1) {
      throw new Error('Rebalancing group not found');
    }

    const group = this.groups[groupIndex];
    this.groups[groupIndex] = {
      ...group,
      ...input,
      updatedAt: new Date(),
    };

    return this.groups[groupIndex];
  }

  async deleteGroup(id: string): Promise<boolean> {
    const groupIndex = this.groups.findIndex(group => group.id === id);
    if (groupIndex === -1) {
      return false;
    }

    this.groups.splice(groupIndex, 1);
    this.targetAllocations.delete(id);
    return true;
  }

  async getGroups(): Promise<RebalancingGroup[]> {
    return this.groups;
  }

  async getGroup(id: string): Promise<RebalancingGroup | null> {
    return this.groups.find(group => group.id === id) || null;
  }

  async setTargetAllocations(input: SetTargetAllocationsInput): Promise<boolean> {
    const group = await this.getGroup(input.groupId);
    if (!group) {
      throw new Error('Rebalancing group not found');
    }

    // Validate that percentages sum to 100
    const totalPercentage = input.targets.reduce((sum, target) => sum + target.targetPercentage, 0);
    if (Math.abs(totalPercentage - 100) > 0.01) {
      throw new Error('Target percentages must sum to 100');
    }

    // Validate that all tags belong to the group
    const invalidTags = input.targets.filter(target => !group.tagIds.includes(target.tagId));
    if (invalidTags.length > 0) {
      throw new Error(`Invalid tags: ${invalidTags.map(t => t.tagId).join(', ')}`);
    }

    const targetsMap = new Map<string, number>();
    input.targets.forEach(target => {
      targetsMap.set(target.tagId, target.targetPercentage);
    });

    this.targetAllocations.set(input.groupId, targetsMap);
    return true;
  }

  async getRebalancingAnalysis(groupId: string): Promise<RebalancingAnalysis> {
    const group = await this.getGroup(groupId);
    if (!group) {
      throw new Error('Rebalancing group not found');
    }

    const allHoldings = await this.brokerageService.getHoldings();
    const tags = await this.tagsService.getTags();
    const tagMap = new Map(tags.map(tag => [tag.id, tag]));

    // Calculate current allocations
    const allocations: TagAllocation[] = [];
    let totalValue = 0;

    for (const tagId of group.tagIds) {
      const tag = tagMap.get(tagId);
      if (!tag) continue;

      const holdingsForTag = await this.holdingsService.getHoldingsForTag(tagId);
      const tagValue = holdingsForTag.reduce((sum, symbol) => {
        const holding = allHoldings.find(h => h.symbol === symbol);
        return sum + (holding?.marketValue || 0);
      }, 0);

      totalValue += tagValue;
    }

    // Create allocations with current and target percentages
    for (const tagId of group.tagIds) {
      const tag = tagMap.get(tagId);
      if (!tag) continue;

      const holdingsForTag = await this.holdingsService.getHoldingsForTag(tagId);
      const tagValue = holdingsForTag.reduce((sum, symbol) => {
        const holding = allHoldings.find(h => h.symbol === symbol);
        return sum + (holding?.marketValue || 0);
      }, 0);

      const currentPercentage = totalValue > 0 ? (tagValue / totalValue) * 100 : 0;
      const targetPercentage = this.targetAllocations.get(groupId)?.get(tagId) || 0;
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

  async calculateInvestmentRecommendation(input: CalculateInvestmentInput): Promise<InvestmentRecommendation[]> {
    const analysis = await this.getRebalancingAnalysis(input.groupId);
    const newTotalValue = analysis.totalValue + input.investmentAmount;

    const recommendations: InvestmentRecommendation[] = [];

    for (const allocation of analysis.allocations) {
      const targetValue = (allocation.targetPercentage / 100) * newTotalValue;
      const neededValue = targetValue - allocation.currentValue;
      const recommendedAmount = Math.max(0, neededValue);
      const recommendedPercentage = input.investmentAmount > 0 ? (recommendedAmount / input.investmentAmount) * 100 : 0;

      // Get suggested symbols for this tag
      const suggestedSymbols = await this.holdingsService.getHoldingsForTag(allocation.tagId);

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