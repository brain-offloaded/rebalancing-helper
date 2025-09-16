import { Injectable } from '@nestjs/common';
import { HoldingTag, EnrichedHolding } from './holdings.entities';
import { AddHoldingTagInput, RemoveHoldingTagInput, SetHoldingTagsInput } from './holdings.dto';

@Injectable()
export class HoldingsService {
  private holdingTags: HoldingTag[] = [];

  async addTag(input: AddHoldingTagInput): Promise<HoldingTag> {
    // Check if tag already exists
    const existingTag = this.holdingTags.find(
      tag => tag.holdingSymbol === input.holdingSymbol && tag.tagId === input.tagId
    );

    if (existingTag) {
      return existingTag;
    }

    const holdingTag: HoldingTag = {
      id: Date.now().toString(),
      holdingSymbol: input.holdingSymbol,
      tagId: input.tagId,
      createdAt: new Date(),
    };

    this.holdingTags.push(holdingTag);
    return holdingTag;
  }

  async removeTag(input: RemoveHoldingTagInput): Promise<boolean> {
    const index = this.holdingTags.findIndex(
      tag => tag.holdingSymbol === input.holdingSymbol && tag.tagId === input.tagId
    );

    if (index === -1) {
      return false;
    }

    this.holdingTags.splice(index, 1);
    return true;
  }

  async setTags(input: SetHoldingTagsInput): Promise<HoldingTag[]> {
    // Remove all existing tags for this holding
    this.holdingTags = this.holdingTags.filter(
      tag => tag.holdingSymbol !== input.holdingSymbol
    );

    // Add new tags
    const newTags: HoldingTag[] = input.tagIds.map(tagId => ({
      id: `${Date.now()}-${tagId}`,
      holdingSymbol: input.holdingSymbol,
      tagId,
      createdAt: new Date(),
    }));

    this.holdingTags.push(...newTags);
    return newTags;
  }

  async getHoldingTags(holdingSymbol?: string): Promise<HoldingTag[]> {
    if (holdingSymbol) {
      return this.holdingTags.filter(tag => tag.holdingSymbol === holdingSymbol);
    }
    return this.holdingTags;
  }

  async getTagsForHolding(holdingSymbol: string): Promise<string[]> {
    return this.holdingTags
      .filter(tag => tag.holdingSymbol === holdingSymbol)
      .map(tag => tag.tagId);
  }

  async getHoldingsForTag(tagId: string): Promise<string[]> {
    return this.holdingTags
      .filter(tag => tag.tagId === tagId)
      .map(tag => tag.holdingSymbol);
  }
}