import { TagsService } from './tags.service';
import { PrismaService } from '../prisma/prisma.service';

describe('TagsService', () => {
  let service: TagsService;
  let prismaMock: {
    tag: {
      update: jest.Mock;
    };
  };

  beforeEach(() => {
    prismaMock = {
      tag: {
        update: jest.fn(),
      },
    };

    service = new TagsService(prismaMock as unknown as PrismaService);
  });

  it('updateTag 호출 시 color가 제공되면 Prisma data에 color가 포함된다', async () => {
    const updatedTag = { id: 'tag-id', color: '#abcdef' };
    prismaMock.tag.update.mockResolvedValue(updatedTag);

    const result = await service.updateTag({
      id: 'tag-id',
      color: '#abcdef',
    });

    expect(prismaMock.tag.update).toHaveBeenCalledWith({
      where: { id: 'tag-id' },
      data: {
        color: '#abcdef',
      },
    });
    expect(result).toBe(updatedTag);
  });

  it('updateTag 호출 시 color가 undefined이면 Prisma data에서 color가 제외되어 기존 값을 유지한다', async () => {
    const updatedTag = { id: 'tag-id', name: 'updated' };
    prismaMock.tag.update.mockResolvedValue(updatedTag);

    const result = await service.updateTag({
      id: 'tag-id',
      name: 'updated',
      color: undefined,
    });

    expect(prismaMock.tag.update).toHaveBeenCalledWith({
      where: { id: 'tag-id' },
      data: {
        name: 'updated',
      },
    });
    expect(result).toBe(updatedTag);
  });
});
