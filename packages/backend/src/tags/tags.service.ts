import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { Tag } from './tags.entities';
import { CreateTagInput, UpdateTagInput } from './tags.dto';

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  createTag(input: CreateTagInput): Promise<Tag> {
    const data: Prisma.TagCreateInput = {
      name: input.name,
      description: input.description ?? null,
      color: input.color,
    };

    return this.prisma.tag.create({
      data,
    });
  }

  updateTag(input: UpdateTagInput): Promise<Tag> {
    const { id, ...updates } = input;

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

  async deleteTag(id: string): Promise<boolean> {
    try {
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

  getTags(): Promise<Tag[]> {
    return this.prisma.tag.findMany({
      orderBy: { name: 'asc' },
    });
  }

  getTag(id: string): Promise<Tag | null> {
    return this.prisma.tag.findUnique({ where: { id } });
  }
}
