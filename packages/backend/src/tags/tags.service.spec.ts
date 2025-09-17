import { TagsService } from './tags.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTagInput, UpdateTagInput } from './tags.dto';
import { Tag } from './tags.entities';
import { createPrismaKnownRequestError } from '../test-utils/prisma-error';

describe('TagsService', () => {
  let prismaMock: {
    tag: {
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
    };
  };
  let service: TagsService;

  beforeAll(() => {
    createPrismaKnownRequestError('P0000');
  });

  const baseDate = new Date('2024-01-01T00:00:00Z');

  beforeEach(() => {
    prismaMock = {
      tag: {
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
    };

    service = new TagsService(prismaMock as unknown as PrismaService);
  });

  it('createTag는 설명이 없을 경우 null로 저장한다', async () => {
    const input: CreateTagInput = {
      name: '성장주',
      color: '#ff0000',
    };
    const created: Tag = {
      id: 'tag-1',
      name: input.name,
      description: null,
      color: input.color,
      createdAt: baseDate,
      updatedAt: baseDate,
    } as Tag;
    prismaMock.tag.create.mockResolvedValue(created);

    const result = await service.createTag(input);

    expect(prismaMock.tag.create).toHaveBeenCalledWith({
      data: {
        name: input.name,
        description: null,
        color: input.color,
      },
    });
    expect(result).toBe(created);
  });

  it('updateTag는 전달된 필드만 갱신한다', async () => {
    const input: UpdateTagInput = {
      id: 'tag-1',
      name: '배당주',
      description: '배당 수익용',
    };
    const updated: Tag = {
      id: input.id,
      name: input.name!,
      description: input.description!,
      color: '#00ff00',
      createdAt: baseDate,
      updatedAt: baseDate,
    } as Tag;
    prismaMock.tag.update.mockResolvedValue(updated);

    const result = await service.updateTag(input);

    expect(prismaMock.tag.update).toHaveBeenCalledWith({
      where: { id: input.id },
      data: {
        name: input.name,
        description: input.description,
      },
    });
    expect(result).toBe(updated);
  });

  it('updateTag는 color가 undefined이면 Prisma 데이터에서 제외한다', async () => {
    const input = {
      id: 'tag-2',
      name: '성장주',
      color: undefined,
    } as UpdateTagInput;
    const updated: Tag = {
      id: input.id,
      name: input.name!,
      description: null,
      color: '#123456',
      createdAt: baseDate,
      updatedAt: baseDate,
    } as Tag;
    prismaMock.tag.update.mockResolvedValue(updated);

    const result = await service.updateTag(input);

    expect(prismaMock.tag.update).toHaveBeenCalledWith({
      where: { id: input.id },
      data: {
        name: input.name,
      },
    });
    expect(result).toBe(updated);
  });

  it('updateTag는 color를 전달하면 해당 값으로 갱신한다', async () => {
    const input: UpdateTagInput = {
      id: 'tag-3',
      color: '#abcdef',
    };
    const updated: Tag = {
      id: input.id,
      name: '기존',
      description: null,
      color: input.color!,
      createdAt: baseDate,
      updatedAt: baseDate,
    } as Tag;
    prismaMock.tag.update.mockResolvedValue(updated);

    const result = await service.updateTag(input);

    expect(prismaMock.tag.update).toHaveBeenCalledWith({
      where: { id: input.id },
      data: {
        color: input.color,
      },
    });
    expect(result).toBe(updated);
  });

  it('deleteTag는 삭제 성공 시 true를 반환한다', async () => {
    prismaMock.tag.delete.mockResolvedValue({});

    await expect(service.deleteTag('tag-1')).resolves.toBe(true);
    expect(prismaMock.tag.delete).toHaveBeenCalledWith({
      where: { id: 'tag-1' },
    });
  });

  it('deleteTag는 대상이 없으면 false를 반환한다', async () => {
    const error = createPrismaKnownRequestError('P2025');
    prismaMock.tag.delete.mockRejectedValue(error);

    await expect(service.deleteTag('tag-1')).resolves.toBe(false);
  });

  it('deleteTag는 Prisma 오류가 P2025가 아니면 다시 던진다', async () => {
    const unexpectedError = createPrismaKnownRequestError('P5000');
    prismaMock.tag.delete.mockRejectedValue(unexpectedError);

    await expect(service.deleteTag('tag-1')).rejects.toBe(unexpectedError);
  });

  it('getTags는 이름 기준으로 정렬하여 반환한다', async () => {
    const tags: Tag[] = [];
    prismaMock.tag.findMany.mockResolvedValue(tags);

    await expect(service.getTags()).resolves.toBe(tags);
    expect(prismaMock.tag.findMany).toHaveBeenCalledWith({
      orderBy: { name: 'asc' },
    });
  });

  it('getTag는 ID로 태그를 조회한다', async () => {
    const tag: Tag = {
      id: 'tag-1',
      name: '성장주',
      description: null,
      color: '#ff0000',
      createdAt: baseDate,
      updatedAt: baseDate,
    } as Tag;
    prismaMock.tag.findUnique.mockResolvedValue(tag);

    await expect(service.getTag('tag-1')).resolves.toBe(tag);
    expect(prismaMock.tag.findUnique).toHaveBeenCalledWith({
      where: { id: 'tag-1' },
    });
  });
});
