import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { Tag } from './tags.entities';
import { CreateTagInput, UpdateTagInput } from './tags.dto';

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  createTag(userId: string, input: CreateTagInput): Promise<Tag> {
    const data: Prisma.TagCreateInput = {
      name: input.name,
      description: input.description ?? null,
      color: input.color,
      user: {
        connect: { id: userId },
      },
    };

    return this.prisma.tag.create({
      data,
    });
  }

  async updateTag(userId: string, input: UpdateTagInput): Promise<Tag> {
    const { id, ...updates } = input;

    const existing = await this.prisma.tag.findFirst({
      where: { id, userId },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Tag not found');
    }

    const data: Prisma.TagUpdateInput = {};

    if (updates.name !== undefined) {
      data.name = updates.name;
    }

    if (updates.description !== undefined) {
      data.description = updates.description ?? null;
    }

    if (updates.color !== undefined) {
      data.color = updates.color;
    }

    return this.prisma.tag.update({
      where: { id },
      data,
    });
  }

  async deleteTag(userId: string, id: string): Promise<boolean> {
    try {
      const existing = await this.prisma.tag.findFirst({
        where: { id, userId },
        select: { id: true },
      });

      if (!existing) {
        return false;
      }

      await this.prisma.tag.delete({ where: { id } });
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

  getTags(userId: string): Promise<Tag[]> {
    return this.prisma.tag.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });
  }

  async getTag(userId: string, id: string): Promise<Tag | null> {
    const tag = await this.prisma.tag.findFirst({
      where: { id, userId },
    });

    return tag;
  }
}
