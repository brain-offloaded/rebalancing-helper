import { Injectable } from '@nestjs/common';
import { Tag } from './tags.entities';
import { CreateTagInput, UpdateTagInput } from './tags.dto';

@Injectable()
export class TagsService {
  private tags: Tag[] = [
    {
      id: '1',
      name: 'S&P 500',
      description: 'S&P 500 ETFs and related funds',
      color: '#007bff',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      name: 'International',
      description: 'International stock funds',
      color: '#28a745',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '3',
      name: 'Bonds',
      description: 'Bond funds and fixed income',
      color: '#ffc107',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  async createTag(input: CreateTagInput): Promise<Tag> {
    const tag: Tag = {
      id: Date.now().toString(),
      name: input.name,
      description: input.description,
      color: input.color,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.tags.push(tag);
    return tag;
  }

  async updateTag(input: UpdateTagInput): Promise<Tag> {
    const tagIndex = this.tags.findIndex(tag => tag.id === input.id);
    if (tagIndex === -1) {
      throw new Error('Tag not found');
    }

    const tag = this.tags[tagIndex];
    this.tags[tagIndex] = {
      ...tag,
      ...input,
      updatedAt: new Date(),
    };

    return this.tags[tagIndex];
  }

  async deleteTag(id: string): Promise<boolean> {
    const tagIndex = this.tags.findIndex(tag => tag.id === id);
    if (tagIndex === -1) {
      return false;
    }

    this.tags.splice(tagIndex, 1);
    return true;
  }

  async getTags(): Promise<Tag[]> {
    return this.tags;
  }

  async getTag(id: string): Promise<Tag | null> {
    return this.tags.find(tag => tag.id === id) || null;
  }
}