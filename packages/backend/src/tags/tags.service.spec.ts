import { TagsService } from './tags.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTagInput, UpdateTagInput } from './tags.dto';
import { Tag } from './tags.entities';
import { NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

const USER_ID = 'user-1';

type MockedPrisma = {
  tag: {
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    findMany: jest.Mock;
    findFirst: jest.Mock;
  };
};

describe('TagsService', () => {
  let prismaMock: MockedPrisma;
  let service: TagsService;
  const baseDate = new Date('2024-01-01T00:00:00Z');

  beforeEach(() => {
    prismaMock = {
      tag: {
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
    };

    service = new TagsService(prismaMock as unknown as PrismaService);
  });

  it('createTag는 사용자와 연결된 태그를 생성한다', async () => {
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
    };
    prismaMock.tag.create.mockResolvedValue(created);

    const result = await service.createTag(USER_ID, input);

    expect(prismaMock.tag.create).toHaveBeenCalledWith({
      data: {
        name: input.name,
        description: null,
        color: input.color,
        user: { connect: { id: USER_ID } },
      },
    });
    expect(result).toBe(created);
  });

  it('updateTag는 사용자 소유를 확인한 후 업데이트한다', async () => {
    const input: UpdateTagInput = {
      id: 'tag-1',
      color: '#00ff00',
    };
    prismaMock.tag.findFirst.mockResolvedValue({ id: 'tag-1' });
    const updated: Tag = {
      id: input.id,
      name: '성장주',
      description: null,
      color: input.color!,
      createdAt: baseDate,
      updatedAt: baseDate,
    };
    prismaMock.tag.update.mockResolvedValue(updated);

    const result = await service.updateTag(USER_ID, input);

    expect(prismaMock.tag.findFirst).toHaveBeenCalledWith({
      where: { id: input.id, userId: USER_ID },
      select: { id: true },
    });
    expect(prismaMock.tag.update).toHaveBeenCalledWith({
      where: { id: input.id },
      data: { color: input.color },
    });
    expect(result).toBe(updated);
  });

  it('updateTag는 name과 description 변경을 처리한다', async () => {
    prismaMock.tag.findFirst.mockResolvedValue({ id: 'tag-1' });
    prismaMock.tag.update.mockResolvedValue({
      id: 'tag-1',
      name: '배당주',
      description: '업데이트 설명',
      color: '#ff0000',
      createdAt: baseDate,
      updatedAt: baseDate,
    });

    await service.updateTag(USER_ID, {
      id: 'tag-1',
      name: '배당주',
      description: '업데이트 설명',
    });

    expect(prismaMock.tag.update).toHaveBeenCalledWith({
      where: { id: 'tag-1' },
      data: { name: '배당주', description: '업데이트 설명' },
    });
  });

  it('updateTag는 다른 사용자의 태그면 NotFoundException을 던진다', async () => {
    prismaMock.tag.findFirst.mockResolvedValue(null);

    await expect(
      service.updateTag(USER_ID, { id: 'tag-x', name: 'foo' }),
    ).rejects.toThrow(NotFoundException);
    expect(prismaMock.tag.update).not.toHaveBeenCalled();
  });

  it('deleteTag는 소유권을 확인하고 삭제한다', async () => {
    prismaMock.tag.findFirst.mockResolvedValue({ id: 'tag-1' });
    prismaMock.tag.delete.mockResolvedValue({});

    await expect(service.deleteTag(USER_ID, 'tag-1')).resolves.toBe(true);
    expect(prismaMock.tag.delete).toHaveBeenCalledWith({
      where: { id: 'tag-1' },
    });
  });

  it('deleteTag는 타인의 태그면 false를 반환한다', async () => {
    prismaMock.tag.findFirst.mockResolvedValue(null);

    await expect(service.deleteTag(USER_ID, 'tag-1')).resolves.toBe(false);
    expect(prismaMock.tag.delete).not.toHaveBeenCalled();
  });

  it('deleteTag는 Prisma P2025 오류 시 false를 반환한다', async () => {
    prismaMock.tag.findFirst.mockResolvedValue({ id: 'tag-1' });
    prismaMock.tag.delete.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('not found', {
        clientVersion: 'test',
        code: 'P2025',
      }),
    );

    await expect(service.deleteTag(USER_ID, 'tag-1')).resolves.toBe(false);
  });

  it('deleteTag는 예상치 못한 오류를 다시 던진다', async () => {
    prismaMock.tag.findFirst.mockResolvedValue({ id: 'tag-1' });
    const unexpectedError = new Error('boom');
    prismaMock.tag.delete.mockRejectedValue(unexpectedError);

    await expect(service.deleteTag(USER_ID, 'tag-1')).rejects.toBe(
      unexpectedError,
    );
  });

  it('getTags는 사용자 기준으로 정렬한다', async () => {
    prismaMock.tag.findMany.mockResolvedValue([]);

    await service.getTags(USER_ID);
    expect(prismaMock.tag.findMany).toHaveBeenCalledWith({
      where: { userId: USER_ID },
      orderBy: { name: 'asc' },
    });
  });

  it('getTag는 사용자 ID를 조건에 포함한다', async () => {
    const tag: Tag = {
      id: 'tag-1',
      name: '성장주',
      description: null,
      color: '#ff0000',
      createdAt: baseDate,
      updatedAt: baseDate,
    };
    prismaMock.tag.findFirst.mockResolvedValue(tag);

    await expect(service.getTag(USER_ID, 'tag-1')).resolves.toBe(tag);
    expect(prismaMock.tag.findFirst).toHaveBeenCalledWith({
      where: { id: 'tag-1', userId: USER_ID },
    });
  });

  it('getTag는 태그가 없으면 null을 반환한다', async () => {
    prismaMock.tag.findFirst.mockResolvedValue(null);

    await expect(service.getTag(USER_ID, 'tag-x')).resolves.toBeNull();
  });
});
