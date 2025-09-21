import { HoldingsService } from './holdings.service';
import { PrismaService } from '../prisma/prisma.service';
import { HoldingTag } from './holdings.entities';
import {
  AddHoldingTagInput,
  RemoveHoldingTagInput,
  SetHoldingTagsInput,
} from './holdings.dto';

const USER_ID = 'user-1';

type MockedPrisma = {
  holdingTag: {
    upsert: jest.Mock;
    delete: jest.Mock;
    deleteMany: jest.Mock;
    create: jest.Mock;
    findMany: jest.Mock;
  };
  tag: {
    findFirst: jest.Mock;
  };
  $transaction: jest.Mock;
};

describe('HoldingsService', () => {
  let prismaMock: MockedPrisma;
  let service: HoldingsService;

  beforeEach(() => {
    prismaMock = {
      holdingTag: {
        upsert: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
      },
      tag: {
        findFirst: jest.fn().mockResolvedValue({ id: 'tag-1' }),
      },
      $transaction: jest.fn(),
    };

    service = new HoldingsService(prismaMock as unknown as PrismaService);
  });

  it('addTag는 사용자 소유 태그인지 확인한 후 upsert를 수행한다', async () => {
    const input: AddHoldingTagInput = {
      holdingSymbol: 'AAPL',
      tagId: 'tag-1',
    };
    const created: HoldingTag = {
      id: 'link-1',
      holdingSymbol: input.holdingSymbol,
      tagId: input.tagId,
      createdAt: new Date('2024-01-01T00:00:00Z'),
    };
    prismaMock.holdingTag.upsert.mockResolvedValue(created);

    const result = await service.addTag(USER_ID, input);

    expect(prismaMock.tag.findFirst).toHaveBeenCalledWith({
      where: { id: input.tagId, userId: USER_ID },
      select: { id: true },
    });
    expect(prismaMock.holdingTag.upsert).toHaveBeenCalledWith({
      where: {
        user_holdingSymbol_tagId: {
          userId: USER_ID,
          holdingSymbol: input.holdingSymbol,
          tagId: input.tagId,
        },
      },
      update: {},
      create: {
        holdingSymbol: input.holdingSymbol,
        tagId: input.tagId,
        userId: USER_ID,
      },
    });
    expect(result).toEqual(created);
  });

  it('removeTag는 소유태그인 경우 삭제하고 Boolean을 반환한다', async () => {
    const input: RemoveHoldingTagInput = {
      holdingSymbol: 'AAPL',
      tagId: 'tag-1',
    };
    prismaMock.holdingTag.delete.mockResolvedValue({});

    await expect(service.removeTag(USER_ID, input)).resolves.toBe(true);
    expect(prismaMock.holdingTag.delete).toHaveBeenCalledWith({
      where: {
        user_holdingSymbol_tagId: {
          userId: USER_ID,
          holdingSymbol: input.holdingSymbol,
          tagId: input.tagId,
        },
      },
    });
  });

  it('setTags는 기존 태그를 삭제하고 새 태그를 생성한다', async () => {
    const input: SetHoldingTagsInput = {
      holdingSymbol: 'AAPL',
      tagIds: ['tag-1', 'tag-2'],
    };
    prismaMock.tag.findFirst
      .mockResolvedValueOnce({ id: 'tag-1' })
      .mockResolvedValueOnce({ id: 'tag-2' });

    prismaMock.$transaction.mockImplementation(async (callback) =>
      callback({
        holdingTag: {
          deleteMany: prismaMock.holdingTag.deleteMany.mockResolvedValue({}),
          create: prismaMock.holdingTag.create
            .mockResolvedValueOnce({
              id: 'link-1',
              holdingSymbol: input.holdingSymbol,
              tagId: 'tag-1',
              createdAt: new Date('2024-01-01T00:00:00Z'),
            })
            .mockResolvedValueOnce({
              id: 'link-2',
              holdingSymbol: input.holdingSymbol,
              tagId: 'tag-2',
              createdAt: new Date('2024-01-01T00:00:10Z'),
            }),
        },
      }),
    );

    const result = await service.setTags(USER_ID, input);

    expect(prismaMock.holdingTag.deleteMany).toHaveBeenCalledWith({
      where: { holdingSymbol: input.holdingSymbol, userId: USER_ID },
    });
    expect(prismaMock.holdingTag.create).toHaveBeenNthCalledWith(1, {
      data: {
        holdingSymbol: input.holdingSymbol,
        tagId: 'tag-1',
        userId: USER_ID,
      },
    });
    expect(prismaMock.holdingTag.create).toHaveBeenNthCalledWith(2, {
      data: {
        holdingSymbol: input.holdingSymbol,
        tagId: 'tag-2',
        userId: USER_ID,
      },
    });
    expect(result).toHaveLength(2);
  });

  it('getHoldingTags는 사용자 기준으로 필터링한다', async () => {
    prismaMock.holdingTag.findMany.mockResolvedValue([]);

    await service.getHoldingTags(USER_ID);
    expect(prismaMock.holdingTag.findMany).toHaveBeenCalledWith({
      where: {
        userId: USER_ID,
      },
      orderBy: { createdAt: 'asc' },
    });

    prismaMock.holdingTag.findMany.mockClear();
    await service.getHoldingTags(USER_ID, 'AAPL');
    expect(prismaMock.holdingTag.findMany).toHaveBeenCalledWith({
      where: {
        userId: USER_ID,
        holdingSymbol: 'AAPL',
      },
      orderBy: { createdAt: 'asc' },
    });
  });

  it('getHoldingsForTag는 소유권을 검증한다', async () => {
    prismaMock.holdingTag.findMany.mockResolvedValue([
      { holdingSymbol: 'AAPL' },
      { holdingSymbol: 'MSFT' },
    ]);

    const result = await service.getHoldingsForTag(USER_ID, 'tag-1');

    expect(prismaMock.tag.findFirst).toHaveBeenCalledWith({
      where: { id: 'tag-1', userId: USER_ID },
      select: { id: true },
    });
    expect(result).toEqual(['AAPL', 'MSFT']);
  });

  it('getTagsForHolding은 사용자 기준으로 태그 ID를 반환한다', async () => {
    prismaMock.holdingTag.findMany.mockResolvedValue([
      { tagId: 'tag-1' },
      { tagId: 'tag-2' },
    ]);

    const result = await service.getTagsForHolding(USER_ID, 'AAPL');

    expect(prismaMock.holdingTag.findMany).toHaveBeenCalledWith({
      where: { holdingSymbol: 'AAPL', userId: USER_ID },
      select: { tagId: true },
    });
    expect(result).toEqual(['tag-1', 'tag-2']);
  });

  it('소유하지 않은 태그에 접근하면 NotFoundException을 던진다', async () => {
    prismaMock.tag.findFirst.mockResolvedValueOnce(null);

    await expect(service.getHoldingsForTag(USER_ID, 'tag-x')).rejects.toThrow(
      'Tag not found',
    );
  });
});
