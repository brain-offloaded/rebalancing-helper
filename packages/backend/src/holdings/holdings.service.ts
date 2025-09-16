import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { HoldingTag } from './holdings.entities';
import {
  AddHoldingTagInput,
  RemoveHoldingTagInput,
  SetHoldingTagsInput,
} from './holdings.dto';

@Injectable()
export class HoldingsService {
  constructor(private readonly prisma: PrismaService) {}

  async addTag(input: AddHoldingTagInput): Promise<HoldingTag> {
    return this.prisma.holdingTag.upsert({
      where: {
        holdingSymbol_tagId: {
          holdingSymbol: input.holdingSymbol,
          tagId: input.tagId,
        },
      },
      update: {},
      create: {
        holdingSymbol: input.holdingSymbol,
        tagId: input.tagId,
      },
    });
  }

  async removeTag(input: RemoveHoldingTagInput): Promise<boolean> {
    try {
      await this.prisma.holdingTag.delete({
        where: {
          holdingSymbol_tagId: {
            holdingSymbol: input.holdingSymbol,
            tagId: input.tagId,
          },
        },
      });
      return true;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        return false;
      }
      throw error;
    }
  }

  async setTags(input: SetHoldingTagsInput): Promise<HoldingTag[]> {
    return this.prisma.$transaction(async (tx) => {
      await tx.holdingTag.deleteMany({
        where: { holdingSymbol: input.holdingSymbol },
      });

      const newTags = await Promise.all(
        input.tagIds.map((tagId) =>
          tx.holdingTag.create({
            data: {
              holdingSymbol: input.holdingSymbol,
              tagId,
            },
          }),
        ),
      );

      return newTags;
    });
  }

  async getHoldingTags(holdingSymbol?: string): Promise<HoldingTag[]> {
    return this.prisma.holdingTag.findMany({
      where: holdingSymbol ? { holdingSymbol } : undefined,
      orderBy: { createdAt: 'asc' },
    });
  }

  async getTagsForHolding(holdingSymbol: string): Promise<string[]> {
    const tags = await this.prisma.holdingTag.findMany({
      where: { holdingSymbol },
      select: { tagId: true },
    });
    return tags.map((tag) => tag.tagId);
  }

  async getHoldingsForTag(tagId: string): Promise<string[]> {
    const holdings = await this.prisma.holdingTag.findMany({
      where: { tagId },
      select: { holdingSymbol: true },
    });
    return holdings.map((holding) => holding.holdingSymbol);
  }
}
