import { Injectable, NotFoundException } from '@nestjs/common';
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
}
