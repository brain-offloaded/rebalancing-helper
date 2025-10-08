import { BadRequestException, NotFoundException } from '@nestjs/common';
import { createDecimal } from '@rebalancing-helper/common';
import { RebalancingService } from './rebalancing.service';
import { PrismaService } from '../prisma/prisma.service';
import { HoldingsService } from '../holdings/holdings.service';
import { HoldingSource } from '../holdings/holdings.entities';
import { CurrencyConversionService } from '../yahoo/currency-conversion.service';
import { TypedConfigService } from '../typed-config';
import {
  CreateRebalancingGroupInput,
  UpdateRebalancingGroupInput,
  SetTargetAllocationsInput,
  CalculateInvestmentInput,
} from './rebalancing.dto';
import { Prisma } from '@prisma/client';

const USER_ID = 'user-1';
const baseDate = new Date('2024-01-01T00:00:00Z');

type MockedPrisma = {
  rebalancingGroup: {
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    findMany: jest.Mock;
    findFirst: jest.Mock;
  };
  rebalancingGroupTag: {
    createMany: jest.Mock;
    deleteMany: jest.Mock;
  };
  tag: {
    count: jest.Mock;
    findMany: jest.Mock;
  };
  targetAllocation: {
    findMany: jest.Mock;
    deleteMany: jest.Mock;
    createMany: jest.Mock;
  };
  $transaction: jest.Mock;
};

const buildGroup = (
  overrides: Partial<
    Prisma.RebalancingGroupGetPayload<{ include: { tags: true } }>
  > = {},
) => ({
  id: overrides.id ?? 'group-1',
  name: overrides.name ?? '성장 포트폴리오',
  description: Object.prototype.hasOwnProperty.call(overrides, 'description')
    ? (overrides.description ?? null)
    : '기본 설명',
  createdAt: overrides.createdAt ?? baseDate,
  updatedAt: overrides.updatedAt ?? baseDate,
  userId: overrides.userId ?? USER_ID,
  tags:
    overrides.tags ??
    ([
      { groupId: 'group-1', tagId: 'tag-1', createdAt: baseDate },
      { groupId: 'group-1', tagId: 'tag-2', createdAt: baseDate },
    ] satisfies { groupId: string; tagId: string; createdAt: Date }[]),
});

describe('RebalancingService', () => {
  let prismaMock: MockedPrisma;
  let holdingsServiceMock: jest.Mocked<HoldingsService>;
  let currencyConversionServiceMock: jest.Mocked<CurrencyConversionService>;
  let configServiceMock: jest.Mocked<TypedConfigService>;
  let service: RebalancingService;

  beforeEach(() => {
    prismaMock = {
      rebalancingGroup: {
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
      rebalancingGroupTag: {
        createMany: jest.fn(),
        deleteMany: jest.fn(),
      },
      tag: {
        count: jest.fn(),
        findMany: jest.fn(),
      },
      targetAllocation: {
        findMany: jest.fn(),
        deleteMany: jest.fn(),
        createMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    holdingsServiceMock = {
      getHoldingsForTag: jest.fn(),
      getHoldings: jest.fn(),
    } as unknown as jest.Mocked<HoldingsService>;

    holdingsServiceMock.getHoldings.mockResolvedValue([]);

    currencyConversionServiceMock = {
      getRate: jest.fn().mockResolvedValue(createDecimal(1)),
      convert: jest
        .fn()
        .mockImplementation(async (amount: number) => createDecimal(amount)),
    } as unknown as jest.Mocked<CurrencyConversionService>;

    configServiceMock = {
      get: jest.fn().mockReturnValue('USD'),
    } as unknown as jest.Mocked<TypedConfigService>;

    service = new RebalancingService(
      prismaMock as unknown as PrismaService,
      holdingsServiceMock,
      currencyConversionServiceMock,
      configServiceMock,
    );
  });

  it('addTagsToGroup은 신규 태그를 추가하고 최신 그룹을 반환한다', async () => {
    const existingGroup = buildGroup();
    const updatedGroup = buildGroup({
      tags: [
        { groupId: 'group-1', tagId: 'tag-1', createdAt: baseDate },
        { groupId: 'group-1', tagId: 'tag-2', createdAt: baseDate },
        { groupId: 'group-1', tagId: 'tag-3', createdAt: baseDate },
      ],
    });
    prismaMock.rebalancingGroup.findFirst
      .mockResolvedValueOnce(existingGroup)
      .mockResolvedValueOnce(updatedGroup);
    prismaMock.tag.count.mockResolvedValue(1);
    prismaMock.rebalancingGroupTag.createMany.mockResolvedValue({ count: 1 });

    const result = await service.addTagsToGroup(USER_ID, {
      groupId: 'group-1',
      tagIds: ['tag-2', 'tag-3', 'tag-3'],
    });

    expect(prismaMock.rebalancingGroupTag.createMany).toHaveBeenCalledWith({
      data: [{ groupId: 'group-1', tagId: 'tag-3' }],
    });
    expect(prismaMock.tag.count).toHaveBeenCalledWith({
      where: { id: { in: ['tag-3'] }, userId: USER_ID },
    });
    expect(result.tagIds).toEqual(['tag-1', 'tag-2', 'tag-3']);
  });

  it('removeTagsFromGroup은 태그와 관련 목표를 제거한다', async () => {
    const existingGroup = buildGroup({
      tags: [
        { groupId: 'group-1', tagId: 'tag-1', createdAt: baseDate },
        { groupId: 'group-1', tagId: 'tag-2', createdAt: baseDate },
        { groupId: 'group-1', tagId: 'tag-3', createdAt: baseDate },
      ],
    });
    const updatedGroup = buildGroup({
      tags: [{ groupId: 'group-1', tagId: 'tag-1', createdAt: baseDate }],
    });
    prismaMock.rebalancingGroup.findFirst
      .mockResolvedValueOnce(existingGroup)
      .mockResolvedValueOnce(updatedGroup);
    prismaMock.rebalancingGroupTag.deleteMany.mockResolvedValue({ count: 2 });
    prismaMock.targetAllocation.deleteMany.mockResolvedValue({ count: 2 });

    const result = await service.removeTagsFromGroup(USER_ID, {
      groupId: 'group-1',
      tagIds: ['tag-2', 'tag-3', 'tag-unknown'],
    });

    expect(prismaMock.rebalancingGroupTag.deleteMany).toHaveBeenCalledWith({
      where: { groupId: 'group-1', tagId: { in: ['tag-2', 'tag-3'] } },
    });
    expect(prismaMock.targetAllocation.deleteMany).toHaveBeenCalledWith({
      where: { groupId: 'group-1', tagId: { in: ['tag-2', 'tag-3'] } },
    });
    expect(result.tagIds).toEqual(['tag-1']);
  });

  it('renameGroup은 그룹 이름을 변경한다', async () => {
    const existingGroup = buildGroup();
    const updatedGroup = buildGroup({ name: '새 이름' });
    prismaMock.rebalancingGroup.findFirst.mockResolvedValueOnce(existingGroup);
    prismaMock.rebalancingGroup.update.mockResolvedValue(updatedGroup);

    const result = await service.renameGroup(USER_ID, {
      groupId: 'group-1',
      name: '새 이름',
    });

    expect(prismaMock.rebalancingGroup.update).toHaveBeenCalledWith({
      where: { id: 'group-1' },
      data: { name: '새 이름' },
      include: { tags: true },
    });
    expect(result.name).toBe('새 이름');
  });

  it('createGroup는 사용자 태그 소유 여부를 확인하고 그룹을 생성한다', async () => {
    const input: CreateRebalancingGroupInput = {
      name: '신규 그룹',
      description: '설명',
      tagIds: ['tag-1', 'tag-2', 'tag-1'],
    };
    prismaMock.tag.count.mockResolvedValue(2);
    prismaMock.rebalancingGroup.create.mockResolvedValue(
      buildGroup({
        id: 'group-new',
        name: input.name,
        description: input.description ?? null,
      }),
    );

    const result = await service.createGroup(USER_ID, input);

    expect(prismaMock.tag.count).toHaveBeenCalledWith({
      where: {
        id: { in: ['tag-1', 'tag-2'] },
        userId: USER_ID,
      },
    });
    expect(prismaMock.rebalancingGroup.create).toHaveBeenCalledWith({
      data: {
        name: input.name,
        description: input.description,
        user: { connect: { id: USER_ID } },
        tags: {
          create: [
            { tag: { connect: { id: 'tag-1' } } },
            { tag: { connect: { id: 'tag-2' } } },
          ],
        },
      },
      include: { tags: true },
    });
    expect(result.tagIds).toEqual(['tag-1', 'tag-2']);
  });

  it('createGroup는 태그가 없으면 추가 조회 없이 그룹을 생성한다', async () => {
    const input: CreateRebalancingGroupInput = {
      name: '태그 없는 그룹',
      tagIds: [],
    };
    prismaMock.tag.count.mockResolvedValue(0);
    prismaMock.rebalancingGroup.create.mockResolvedValue(
      buildGroup({ id: 'group-empty', tags: [] }),
    );

    const result = await service.createGroup(USER_ID, input);

    expect(prismaMock.tag.count).not.toHaveBeenCalled();
    expect(result.tagIds).toEqual([]);
  });

  it('createGroup는 소유하지 않은 태그가 있으면 예외를 던진다', async () => {
    prismaMock.tag.count.mockResolvedValue(1);

    await expect(
      service.createGroup(USER_ID, {
        name: '잘못된 그룹',
        tagIds: ['tag-1', 'tag-2'],
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('updateGroup은 그룹 소유 여부를 확인하고 태그를 갱신한다', async () => {
    const input: UpdateRebalancingGroupInput = {
      id: 'group-1',
      name: '수정된 그룹',
      tagIds: ['tag-2', 'tag-3'],
    };
    prismaMock.rebalancingGroup.findFirst.mockResolvedValue({
      id: 'group-1',
      name: '성장 포트폴리오',
      description: '기본 설명',
      createdAt: baseDate,
      updatedAt: baseDate,
      userId: USER_ID,
      tags: [{ groupId: 'group-1', tagId: 'tag-1', createdAt: baseDate }],
    });
    prismaMock.tag.count.mockResolvedValue(2);
    prismaMock.rebalancingGroup.update.mockResolvedValue(
      buildGroup({
        name: input.name,
        tags: [
          { groupId: 'group-1', tagId: 'tag-2', createdAt: baseDate },
          { groupId: 'group-1', tagId: 'tag-3', createdAt: baseDate },
        ],
      }),
    );

    const result = await service.updateGroup(USER_ID, input);

    expect(prismaMock.rebalancingGroup.findFirst).toHaveBeenCalledWith({
      where: { id: input.id, userId: USER_ID },
      include: { tags: true },
    });
    expect(prismaMock.tag.count).toHaveBeenCalledWith({
      where: { id: { in: ['tag-2', 'tag-3'] }, userId: USER_ID },
    });
    expect(prismaMock.rebalancingGroup.update).toHaveBeenCalledWith({
      where: { id: input.id },
      data: {
        name: input.name,
        tags: {
          deleteMany: {},
          create: [
            { tag: { connect: { id: 'tag-2' } } },
            { tag: { connect: { id: 'tag-3' } } },
          ],
        },
      },
      include: { tags: true },
    });
    expect(result.tagIds).toEqual(['tag-2', 'tag-3']);
  });

  it('updateGroup은 description을 null로 설정할 수 있다', async () => {
    prismaMock.rebalancingGroup.findFirst.mockResolvedValue(
      buildGroup({
        tags: [{ groupId: 'group-1', tagId: 'tag-1', createdAt: baseDate }],
      }),
    );
    prismaMock.rebalancingGroup.update.mockResolvedValue(
      buildGroup({ description: null }),
    );

    const result = await service.updateGroup(USER_ID, {
      id: 'group-1',
      description: null,
    } as unknown as UpdateRebalancingGroupInput);

    expect(prismaMock.rebalancingGroup.update).toHaveBeenCalledWith({
      where: { id: 'group-1' },
      data: { description: null },
      include: { tags: true },
    });
    expect(result.description).toBeNull();
  });

  it('deleteGroup은 소유하지 않은 그룹이면 false를 반환한다', async () => {
    prismaMock.rebalancingGroup.findFirst.mockResolvedValue(null);

    await expect(service.deleteGroup(USER_ID, 'missing')).resolves.toBe(false);
    expect(prismaMock.rebalancingGroup.delete).not.toHaveBeenCalled();
  });

  it('deleteGroup은 소유한 그룹을 삭제한다', async () => {
    prismaMock.rebalancingGroup.findFirst.mockResolvedValue(buildGroup());
    prismaMock.rebalancingGroup.delete.mockResolvedValue({});

    await expect(service.deleteGroup(USER_ID, 'group-1')).resolves.toBe(true);
    expect(prismaMock.rebalancingGroup.delete).toHaveBeenCalledWith({
      where: { id: 'group-1' },
    });
  });

  it('deleteGroup은 Prisma P2025 오류가 발생하면 false를 반환한다', async () => {
    prismaMock.rebalancingGroup.findFirst.mockResolvedValue(buildGroup());
    const prismaError = new Prisma.PrismaClientKnownRequestError('error', {
      code: 'P2025',
      clientVersion: '1',
    });
    prismaMock.rebalancingGroup.delete.mockRejectedValue(prismaError);

    await expect(service.deleteGroup(USER_ID, 'group-1')).resolves.toBe(false);
  });

  it('deleteGroup은 알 수 없는 오류가 발생하면 다시 던진다', async () => {
    prismaMock.rebalancingGroup.findFirst.mockResolvedValue(buildGroup());
    const unexpected = new Error('boom');
    prismaMock.rebalancingGroup.delete.mockRejectedValue(unexpected);

    await expect(service.deleteGroup(USER_ID, 'group-1')).rejects.toBe(
      unexpected,
    );
  });

  it('getGroups는 사용자별 그룹을 반환한다', async () => {
    prismaMock.rebalancingGroup.findMany.mockResolvedValue([
      buildGroup(),
      buildGroup({
        id: 'group-2',
        tags: [{ groupId: 'group-2', tagId: 'tag-3', createdAt: baseDate }],
      }),
    ]);

    const result = await service.getGroups(USER_ID);

    expect(prismaMock.rebalancingGroup.findMany).toHaveBeenCalledWith({
      where: { userId: USER_ID },
      include: { tags: true },
      orderBy: { createdAt: 'asc' },
    });
    expect(result).toHaveLength(2);
    expect(result[0].tagIds).toEqual(['tag-1', 'tag-2']);
  });

  it('setTargetAllocations는 합이 100이 아니면 예외를 던진다', async () => {
    prismaMock.rebalancingGroup.findFirst.mockResolvedValue(buildGroup());

    await expect(
      service.setTargetAllocations(USER_ID, {
        groupId: 'group-1',
        targets: [
          { tagId: 'tag-1', targetPercentage: 40 },
          { tagId: 'tag-2', targetPercentage: 40 },
        ],
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('setTargetAllocations는 그룹에 없는 태그가 포함되면 예외를 던진다', async () => {
    prismaMock.rebalancingGroup.findFirst.mockResolvedValue(buildGroup());

    await expect(
      service.setTargetAllocations(USER_ID, {
        groupId: 'group-1',
        targets: [
          { tagId: 'tag-1', targetPercentage: 50 },
          { tagId: 'tag-unknown', targetPercentage: 50 },
        ],
      }),
    ).rejects.toThrow('Invalid tags: tag-unknown');
  });

  it('setTargetAllocations는 기존 목표를 대체한다', async () => {
    const input: SetTargetAllocationsInput = {
      groupId: 'group-1',
      targets: [
        { tagId: 'tag-1', targetPercentage: 60 },
        { tagId: 'tag-2', targetPercentage: 40 },
      ],
    };
    prismaMock.rebalancingGroup.findFirst.mockResolvedValue(buildGroup());
    prismaMock.$transaction.mockImplementation(async (callback) =>
      callback({
        targetAllocation: {
          deleteMany: prismaMock.targetAllocation.deleteMany,
          createMany: prismaMock.targetAllocation.createMany,
        },
      }),
    );
    prismaMock.targetAllocation.deleteMany.mockResolvedValue({});
    prismaMock.targetAllocation.createMany.mockResolvedValue({ count: 2 });

    await expect(service.setTargetAllocations(USER_ID, input)).resolves.toBe(
      true,
    );
    expect(prismaMock.targetAllocation.deleteMany).toHaveBeenCalledWith({
      where: { groupId: input.groupId },
    });
    expect(prismaMock.targetAllocation.createMany).toHaveBeenCalledWith({
      data: [
        { groupId: input.groupId, tagId: 'tag-1', targetPercentage: 60 },
        { groupId: input.groupId, tagId: 'tag-2', targetPercentage: 40 },
      ],
    });
  });

  it('getGroup은 사용자 ID에 해당하는 그룹을 반환한다', async () => {
    prismaMock.rebalancingGroup.findFirst.mockResolvedValue(buildGroup());

    await expect(service.getGroup(USER_ID, 'group-1')).resolves.toEqual({
      id: 'group-1',
      name: '성장 포트폴리오',
      description: '기본 설명',
      tagIds: ['tag-1', 'tag-2'],
      createdAt: baseDate,
      updatedAt: baseDate,
    });

    prismaMock.rebalancingGroup.findFirst.mockResolvedValue(null);
    await expect(service.getGroup(USER_ID, 'missing')).resolves.toBeNull();
  });

  it('getRebalancingAnalysis는 사용자 데이터를 기반으로 분석을 생성한다', async () => {
    holdingsServiceMock.getHoldings.mockResolvedValue([]);

    prismaMock.rebalancingGroup.findFirst.mockResolvedValue(buildGroup());
    prismaMock.tag.findMany.mockResolvedValue([
      {
        id: 'tag-1',
        name: '성장주',
        description: null,
        color: '#ff0000',
        createdAt: baseDate,
        updatedAt: baseDate,
      },
      {
        id: 'tag-2',
        name: '배당주',
        description: null,
        color: '#00ff00',
        createdAt: baseDate,
        updatedAt: baseDate,
      },
    ]);
    holdingsServiceMock.getHoldings.mockResolvedValue([
      {
        id: 'holding-1',
        source: HoldingSource.BROKERAGE,
        accountId: 'acc-1',
        market: null,
        symbol: 'SPY',
        name: 'SPY',
        alias: null,
        quantity: 1,
        currentPrice: 100,
        marketValue: 100,
        currency: 'USD',
        lastUpdated: baseDate,
        createdAt: baseDate,
        updatedAt: baseDate,
      },
    ]);
    holdingsServiceMock.getHoldingsForTag
      .mockResolvedValueOnce(['SPY'])
      .mockResolvedValueOnce([]);
    prismaMock.targetAllocation.findMany.mockResolvedValue([
      {
        id: 'alloc-1',
        groupId: 'group-1',
        tagId: 'tag-1',
        targetPercentage: 70,
      },
      {
        id: 'alloc-2',
        groupId: 'group-1',
        tagId: 'tag-2',
        targetPercentage: 30,
      },
    ]);

    const analysis = await service.getRebalancingAnalysis(USER_ID, 'group-1');

    expect(holdingsServiceMock.getHoldings).toHaveBeenCalledWith(USER_ID);
    expect(analysis.totalValue).toBe(100);
    expect(analysis.baseCurrency).toBe('USD');
    expect(analysis.allocations).toHaveLength(2);
  });

  it('getRebalancingAnalysis는 태그 정보가 없으면 해당 항목을 건너뛴다', async () => {
    prismaMock.rebalancingGroup.findFirst.mockResolvedValue(buildGroup());
    prismaMock.tag.findMany.mockResolvedValue([
      {
        id: 'tag-1',
        name: '성장주',
        description: null,
        color: '#ff0000',
        createdAt: baseDate,
        updatedAt: baseDate,
      },
    ]);
    holdingsServiceMock.getHoldings.mockResolvedValue([
      {
        id: 'holding-1',
        source: HoldingSource.BROKERAGE,
        accountId: 'acc-1',
        market: null,
        symbol: 'SPY',
        name: 'SPY',
        alias: null,
        quantity: 1,
        currentPrice: 100,
        marketValue: 100,
        currency: 'USD',
        lastUpdated: baseDate,
        createdAt: baseDate,
        updatedAt: baseDate,
      },
    ]);
    holdingsServiceMock.getHoldingsForTag
      .mockResolvedValueOnce(['SPY'])
      .mockResolvedValueOnce([]);
    prismaMock.targetAllocation.findMany.mockResolvedValue([]);

    const analysis = await service.getRebalancingAnalysis(USER_ID, 'group-1');

    expect(analysis.allocations).toHaveLength(1);
    expect(analysis.allocations[0].tagId).toBe('tag-1');
  });

  it('getRebalancingAnalysis는 총 자산 가치가 0이면 비중을 0으로 설정한다', async () => {
    prismaMock.rebalancingGroup.findFirst.mockResolvedValue(buildGroup());
    prismaMock.tag.findMany.mockResolvedValue([
      {
        id: 'tag-1',
        name: '성장주',
        description: null,
        color: '#ff0000',
        createdAt: baseDate,
        updatedAt: baseDate,
      },
      {
        id: 'tag-2',
        name: '배당주',
        description: null,
        color: '#00ff00',
        createdAt: baseDate,
        updatedAt: baseDate,
      },
    ]);
    holdingsServiceMock.getHoldings.mockResolvedValue([]);
    holdingsServiceMock.getHoldingsForTag.mockResolvedValue([]);
    prismaMock.targetAllocation.findMany.mockResolvedValue([]);

    const analysis = await service.getRebalancingAnalysis(USER_ID, 'group-1');

    expect(analysis.totalValue).toBe(0);
    expect(analysis.baseCurrency).toBe('USD');
    expect(
      analysis.allocations.every((item) => item.currentPercentage === 0),
    ).toBe(true);
  });

  it('getRebalancingAnalysis는 수동 보유 종목 가치를 포함한다', async () => {
    prismaMock.rebalancingGroup.findFirst.mockResolvedValue(buildGroup());
    prismaMock.tag.findMany.mockResolvedValue([
      {
        id: 'tag-1',
        name: 'ETF',
        description: null,
        color: '#123456',
        createdAt: baseDate,
        updatedAt: baseDate,
      },
    ]);
    holdingsServiceMock.getHoldings.mockResolvedValue([
      {
        id: 'manual-1',
        source: HoldingSource.MANUAL,
        accountId: 'manual-acc-1',
        market: 'US',
        symbol: 'VOO',
        name: 'VOO',
        alias: null,
        quantity: 2,
        currentPrice: 400,
        marketValue: 800,
        currency: 'USD',
        lastUpdated: baseDate,
        createdAt: baseDate,
        updatedAt: baseDate,
      },
    ]);
    const requestedTagIds: string[] = [];
    holdingsServiceMock.getHoldingsForTag.mockImplementation(
      async (_user, tagId) => {
        requestedTagIds.push(tagId);
        return tagId === 'tag-1' ? ['VOO'] : [];
      },
    );
    prismaMock.targetAllocation.findMany.mockResolvedValue([
      {
        id: 'alloc-1',
        groupId: 'group-1',
        tagId: 'tag-1',
        targetPercentage: 100,
        createdAt: baseDate,
        updatedAt: baseDate,
      },
    ]);

    const analysis = await service.getRebalancingAnalysis(USER_ID, 'group-1');

    expect(analysis.totalValue).toBe(800);
    expect(analysis.baseCurrency).toBe('USD');
    expect(analysis.allocations).toHaveLength(1);
    expect(analysis.allocations[0].currentValue).toBe(800);
    expect(analysis.allocations[0].currentPercentage).toBe(100);
    expect(requestedTagIds).toContain('tag-1');
  });

  it('getRebalancingAnalysis는 다른 통화를 기준 통화로 환산한다', async () => {
    prismaMock.rebalancingGroup.findFirst.mockResolvedValue(buildGroup());
    prismaMock.tag.findMany.mockResolvedValue([
      {
        id: 'tag-1',
        name: 'ETF',
        description: null,
        color: '#abcdef',
        createdAt: baseDate,
        updatedAt: baseDate,
      },
    ]);
    holdingsServiceMock.getHoldings.mockResolvedValue([
      {
        id: 'holding-krw',
        source: HoldingSource.BROKERAGE,
        accountId: 'acc-1',
        market: null,
        symbol: 'SPY',
        name: 'SPY',
        alias: null,
        quantity: 10,
        currentPrice: 100000,
        marketValue: 1000000,
        currency: 'KRW',
        lastUpdated: baseDate,
        createdAt: baseDate,
        updatedAt: baseDate,
      },
    ]);
    holdingsServiceMock.getHoldingsForTag.mockImplementation(
      async (_user, tagId) => (tagId === 'tag-1' ? ['SPY'] : []),
    );
    prismaMock.targetAllocation.findMany.mockResolvedValue([
      {
        id: 'alloc-krw',
        groupId: 'group-1',
        tagId: 'tag-1',
        targetPercentage: 100,
        createdAt: baseDate,
        updatedAt: baseDate,
      },
    ]);
    currencyConversionServiceMock.getRate.mockResolvedValue(
      createDecimal('0.00075'),
    );

    const analysis = await service.getRebalancingAnalysis(USER_ID, 'group-1');

    expect(currencyConversionServiceMock.getRate).toHaveBeenCalledWith(
      'KRW',
      'USD',
    );
    expect(currencyConversionServiceMock.getRate).toHaveBeenCalledTimes(1);
    expect(analysis.baseCurrency).toBe('USD');
    expect(analysis.totalValue).toBeCloseTo(750, 5);
    expect(analysis.allocations[0].currentValue).toBeCloseTo(750, 5);
  });

  it('calculateInvestmentRecommendation는 분석 결과를 기반으로 추천을 생성한다', async () => {
    const analysis = {
      groupId: 'group-1',
      groupName: '성장 포트폴리오',
      totalValue: 100,
      baseCurrency: 'USD',
      lastUpdated: baseDate,
      allocations: [
        {
          tagId: 'tag-1',
          tagName: '성장주',
          tagColor: '#ff0000',
          currentValue: 60,
          currentPercentage: 60,
          targetPercentage: 70,
          difference: 10,
        },
        {
          tagId: 'tag-2',
          tagName: '배당주',
          tagColor: '#00ff00',
          currentValue: 40,
          currentPercentage: 40,
          targetPercentage: 30,
          difference: -10,
        },
      ],
    };
    jest
      .spyOn(service, 'getRebalancingAnalysis')
      .mockResolvedValue(analysis as never);
    holdingsServiceMock.getHoldingsForTag
      .mockResolvedValueOnce(['SPY'])
      .mockResolvedValueOnce(['QQQ']);

    const input: CalculateInvestmentInput = {
      groupId: 'group-1',
      investmentAmount: 100,
    };

    const recommendations = await service.calculateInvestmentRecommendation(
      USER_ID,
      input,
    );

    expect(service.getRebalancingAnalysis).toHaveBeenCalledWith(
      USER_ID,
      input.groupId,
    );
    expect(recommendations).toHaveLength(2);
    expect(recommendations[0].suggestedSymbols).toEqual(['SPY']);
    expect(recommendations.every((item) => item.baseCurrency === 'USD')).toBe(
      true,
    );
  });

  it('calculateInvestmentRecommendation는 투자 예정 금액을 초과하지 않도록 분배한다', async () => {
    const analysis = {
      groupId: 'group-1',
      groupName: '다중 포트폴리오',
      totalValue: 300,
      baseCurrency: 'USD',
      lastUpdated: baseDate,
      allocations: [
        {
          tagId: 'tag-1',
          tagName: 'S&P 500',
          tagColor: '#ff0000',
          currentValue: 120,
          currentPercentage: 40,
          targetPercentage: 60,
          difference: 20,
        },
        {
          tagId: 'tag-2',
          tagName: '나스닥 100',
          tagColor: '#00ff00',
          currentValue: 90,
          currentPercentage: 30,
          targetPercentage: 40,
          difference: 10,
        },
        {
          tagId: 'tag-3',
          tagName: '채권',
          tagColor: '#0000ff',
          currentValue: 90,
          currentPercentage: 30,
          targetPercentage: 0,
          difference: -30,
        },
      ],
    };
    jest
      .spyOn(service, 'getRebalancingAnalysis')
      .mockResolvedValue(analysis as never);
    holdingsServiceMock.getHoldingsForTag
      .mockResolvedValueOnce(['VOO'])
      .mockResolvedValueOnce(['QQQ'])
      .mockResolvedValueOnce(['BND']);

    const input: CalculateInvestmentInput = {
      groupId: 'group-1',
      investmentAmount: 50,
    };

    const recommendations = await service.calculateInvestmentRecommendation(
      USER_ID,
      input,
    );

    const totalRecommended = recommendations.reduce(
      (sum, item) => sum + item.recommendedAmount,
      0,
    );
    const tag1 = recommendations.find((item) => item.tagId === 'tag-1');
    const tag2 = recommendations.find((item) => item.tagId === 'tag-2');
    const tag3 = recommendations.find((item) => item.tagId === 'tag-3');

    expect(totalRecommended).toBeCloseTo(50, 3);
    expect(tag1?.recommendedAmount ?? 0).toBeCloseTo(32.143, 2);
    expect(tag2?.recommendedAmount ?? 0).toBeCloseTo(17.857, 2);
    expect(tag3?.recommendedAmount ?? 0).toBe(0);
    expect(
      (tag1?.recommendedPercentage ?? 0) + (tag2?.recommendedPercentage ?? 0),
    ).toBeCloseTo(100, 3);
    expect(recommendations.every((item) => item.baseCurrency === 'USD')).toBe(
      true,
    );
  });

  it('calculateInvestmentRecommendation는 투자금이 0이면 비율을 0으로 만든다', async () => {
    const analysis = {
      groupId: 'group-1',
      groupName: '성장 포트폴리오',
      totalValue: 200,
      baseCurrency: 'USD',
      lastUpdated: baseDate,
      allocations: [
        {
          tagId: 'tag-1',
          tagName: '성장주',
          tagColor: '#ff0000',
          currentValue: 200,
          currentPercentage: 100,
          targetPercentage: 100,
          difference: 0,
        },
      ],
    };
    jest
      .spyOn(service, 'getRebalancingAnalysis')
      .mockResolvedValue(analysis as never);
    holdingsServiceMock.getHoldingsForTag.mockResolvedValue(['SPY']);

    const recommendations = await service.calculateInvestmentRecommendation(
      USER_ID,
      { groupId: 'group-1', investmentAmount: 0 },
    );

    expect(recommendations).toEqual([
      {
        tagId: 'tag-1',
        tagName: '성장주',
        recommendedAmount: 0,
        recommendedPercentage: 0,
        suggestedSymbols: ['SPY'],
        baseCurrency: 'USD',
      },
    ]);
  });
});
