import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { Tag } from './tags.entities';
import { CreateTagInput, UpdateTagInput } from './tags.dto';

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  createTag(input: CreateTagInput): Promise<Tag> {
    return this.prisma.tag.create({
      data: {
        name: input.name,
        description: input.description,
        color: input.color,
      },
    });
  }

  updateTag(input: UpdateTagInput): Promise<Tag> {
    const { id, ...updates } = input;

    return this.prisma.tag.update({
      where: { id },
      data: {
        ...(updates.name !== undefined ? { name: updates.name } : {}),
        ...(updates.description !== undefined
          ? { description: updates.description }
          : {}),
        ...(updates.color !== undefined ? { color: updates.color } : {}),
      },
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
