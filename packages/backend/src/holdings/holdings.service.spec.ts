import { HoldingsService } from './holdings.service';
import { PrismaService } from '../prisma/prisma.service';
import { HoldingTag } from './holdings.entities';
import {
  AddHoldingTagInput,
  RemoveHoldingTagInput,
  SetHoldingTagsInput,
} from './holdings.dto';
import { createPrismaKnownRequestError } from '../test-utils/prisma-error';

describe('HoldingsService', () => {
  let prismaMock: {
    holdingTag: {
      upsert: jest.Mock;
      delete: jest.Mock;
      deleteMany: jest.Mock;
      create: jest.Mock;
      findMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let service: HoldingsService;

  beforeAll(() => {
    createPrismaKnownRequestError('P0000');
  });

  beforeEach(() => {
    prismaMock = {
      holdingTag: {
        upsert: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    service = new HoldingsService(prismaMock as unknown as PrismaService);
  });

  it('addTag는 upsert를 호출하고 결과를 반환한다', async () => {
    const input: AddHoldingTagInput = {
      holdingSymbol: 'AAPL',
      tagId: 'growth',
    };
    const createdTag: HoldingTag = {
      id: 'tag-link-1',
      holdingSymbol: input.holdingSymbol,
      tagId: input.tagId,
      createdAt: new Date('2024-01-01T00:00:00Z'),
    };
    prismaMock.holdingTag.upsert.mockResolvedValue(createdTag);

    const result = await service.addTag(input);

    expect(prismaMock.holdingTag.upsert).toHaveBeenCalledWith({
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
    expect(result).toEqual(createdTag);
  });

  it('removeTag는 삭제 성공 시 true를 반환한다', async () => {
    const input: RemoveHoldingTagInput = {
      holdingSymbol: 'AAPL',
      tagId: 'growth',
    };
    prismaMock.holdingTag.delete.mockResolvedValue({});

    await expect(service.removeTag(input)).resolves.toBe(true);
    expect(prismaMock.holdingTag.delete).toHaveBeenCalledWith({
      where: {
        holdingSymbol_tagId: {
          holdingSymbol: input.holdingSymbol,
          tagId: input.tagId,
        },
      },
    });
  });

  it('removeTag는 삭제 대상이 없으면 false를 반환한다', async () => {
    const input: RemoveHoldingTagInput = {
      holdingSymbol: 'AAPL',
      tagId: 'growth',
    };
    const error = createPrismaKnownRequestError('P2025');
    prismaMock.holdingTag.delete.mockRejectedValue(error);

    await expect(service.removeTag(input)).resolves.toBe(false);
  });

  it('removeTag는 다른 오류가 발생하면 다시 던진다', async () => {
    const input: RemoveHoldingTagInput = {
      holdingSymbol: 'AAPL',
      tagId: 'growth',
    };
    const error = new Error('database failure');
    prismaMock.holdingTag.delete.mockRejectedValue(error);

    await expect(service.removeTag(input)).rejects.toThrow('database failure');
  });

  it('removeTag는 Prisma 오류가 P2025가 아니면 그대로 전달한다', async () => {
    const input: RemoveHoldingTagInput = {
      holdingSymbol: 'AAPL',
      tagId: 'growth',
    };
    const prismaError = createPrismaKnownRequestError('P5000');
    prismaMock.holdingTag.delete.mockRejectedValue(prismaError);

    await expect(service.removeTag(input)).rejects.toBe(prismaError);
  });

  it('setTags는 기존 태그를 삭제하고 새 태그를 생성한다', async () => {
    const input: SetHoldingTagsInput = {
      holdingSymbol: 'AAPL',
      tagIds: ['growth', 'dividend'],
    };
    const createdTags: HoldingTag[] = [
      {
        id: 'link-1',
        holdingSymbol: input.holdingSymbol,
        tagId: 'growth',
        createdAt: new Date('2024-01-02T00:00:00Z'),
      },
      {
        id: 'link-2',
        holdingSymbol: input.holdingSymbol,
        tagId: 'dividend',
        createdAt: new Date('2024-01-02T00:00:10Z'),
      },
    ];
    const deleteManyMock = jest
      .fn()
      .mockResolvedValue({ count: 2 });
    const createMock = jest
      .fn()
      .mockResolvedValueOnce(createdTags[0])
      .mockResolvedValueOnce(createdTags[1]);

    prismaMock.$transaction.mockImplementation(async (callback) =>
      callback({
        holdingTag: {
          deleteMany: deleteManyMock,
          create: createMock,
        },
      }),
    );

    const result = await service.setTags(input);

    expect(deleteManyMock).toHaveBeenCalledWith({
      where: { holdingSymbol: input.holdingSymbol },
    });
    expect(createMock).toHaveBeenCalledTimes(2);
    expect(createMock).toHaveBeenNthCalledWith(1, {
      data: {
        holdingSymbol: input.holdingSymbol,
        tagId: 'growth',
      },
    });
    expect(createMock).toHaveBeenNthCalledWith(2, {
      data: {
        holdingSymbol: input.holdingSymbol,
        tagId: 'dividend',
      },
    });
    expect(result).toEqual(createdTags);
  });

  it('getHoldingTags는 심볼 유무에 따라 조회 조건을 전달한다', async () => {
    const holdingTags: HoldingTag[] = [];
    prismaMock.holdingTag.findMany.mockResolvedValue(holdingTags);

    await service.getHoldingTags();
    expect(prismaMock.holdingTag.findMany).toHaveBeenCalledWith({
      where: undefined,
      orderBy: { createdAt: 'asc' },
    });

    prismaMock.holdingTag.findMany.mockClear();
    prismaMock.holdingTag.findMany.mockResolvedValue(holdingTags);

    await service.getHoldingTags('AAPL');
    expect(prismaMock.holdingTag.findMany).toHaveBeenCalledWith({
      where: { holdingSymbol: 'AAPL' },
      orderBy: { createdAt: 'asc' },
    });
  });

  it('getTagsForHolding은 태그 ID 배열을 반환한다', async () => {
    prismaMock.holdingTag.findMany.mockResolvedValue([
      { tagId: 'growth' },
      { tagId: 'dividend' },
    ]);

    await expect(service.getTagsForHolding('AAPL')).resolves.toEqual([
      'growth',
      'dividend',
    ]);
    expect(prismaMock.holdingTag.findMany).toHaveBeenCalledWith({
      where: { holdingSymbol: 'AAPL' },
      select: { tagId: true },
    });
  });

  it('getHoldingsForTag는 보유 종목 심볼 배열을 반환한다', async () => {
    prismaMock.holdingTag.findMany.mockResolvedValue([
      { holdingSymbol: 'AAPL' },
      { holdingSymbol: 'TSLA' },
    ]);

    await expect(service.getHoldingsForTag('growth')).resolves.toEqual([
      'AAPL',
      'TSLA',
    ]);
    expect(prismaMock.holdingTag.findMany).toHaveBeenCalledWith({
      where: { tagId: 'growth' },
      select: { holdingSymbol: true },
    });
  });
});
