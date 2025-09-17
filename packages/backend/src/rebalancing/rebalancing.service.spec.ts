import { Prisma } from '@prisma/client';
import { RebalancingService } from './rebalancing.service';
import { PrismaService } from '../prisma/prisma.service';
import { BrokerageService } from '../brokerage/brokerage.service';
import { HoldingsService } from '../holdings/holdings.service';
import { BrokerageHolding } from '../brokerage/brokerage.entities';
import {
  CreateRebalancingGroupInput,
  UpdateRebalancingGroupInput,
  SetTargetAllocationsInput,
  CalculateInvestmentInput,
} from './rebalancing.dto';
import { RebalancingAnalysis } from './rebalancing.entities';
import { createPrismaKnownRequestError } from '../test-utils/prisma-error';

type GroupWithTags = Prisma.RebalancingGroupGetPayload<{
  include: { tags: true };
}>;

describe('RebalancingService', () => {
  let prismaMock: {
    rebalancingGroup: {
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
    };
    targetAllocation: {
      findMany: jest.Mock;
      deleteMany: jest.Mock;
      createMany: jest.Mock;
    };
    tag: {
      findMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let brokerageServiceMock: {
    getHoldings: jest.Mock;
  };
  let holdingsServiceMock: {
    getHoldingsForTag: jest.Mock;
  };
  let service: RebalancingService;

  const baseDate = new Date('2024-01-01T00:00:00Z');

  beforeAll(() => {
    createPrismaKnownRequestError('P0000');
  });

  const buildGroup = (overrides?: Partial<GroupWithTags>): GroupWithTags => ({
    id: 'group-1',
    name: '성장 포트폴리오',
    description: '기본 설명',
    createdAt: baseDate,
    updatedAt: baseDate,
    tags: [
      { groupId: 'group-1', tagId: 'tag-1', createdAt: baseDate },
      { groupId: 'group-1', tagId: 'tag-2', createdAt: baseDate },
    ],
    ...overrides,
  });

  beforeEach(() => {
    prismaMock = {
      rebalancingGroup: {
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      targetAllocation: {
        findMany: jest.fn(),
        deleteMany: jest.fn(),
        createMany: jest.fn(),
      },
      tag: {
        findMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    brokerageServiceMock = {
      getHoldings: jest.fn(),
    };

    holdingsServiceMock = {
      getHoldingsForTag: jest.fn(),
    };

    service = new RebalancingService(
      prismaMock as unknown as PrismaService,
      brokerageServiceMock as unknown as BrokerageService,
      holdingsServiceMock as unknown as HoldingsService,
    );
  });

  it('createGroup는 태그 중복을 제거하고 그룹을 생성한다', async () => {
    const input: CreateRebalancingGroupInput = {
      name: '신규 그룹',
      description: '새 설명',
      tagIds: ['tag-1', 'tag-2', 'tag-1'],
    };
    const persistedGroup = buildGroup({
      id: 'group-new',
      name: input.name,
      description: input.description ?? null,
    });
    prismaMock.rebalancingGroup.create.mockResolvedValue(persistedGroup);

    const result = await service.createGroup(input);

    expect(prismaMock.rebalancingGroup.create).toHaveBeenCalledWith({
      data: {
        name: input.name,
        description: input.description,
        tags: {
          create: [
            { tag: { connect: { id: 'tag-1' } } },
            { tag: { connect: { id: 'tag-2' } } },
          ],
        },
      },
      include: { tags: true },
    });
    expect(result).toEqual({
      id: 'group-new',
      name: input.name,
      description: input.description,
      tagIds: ['tag-1', 'tag-2'],
      createdAt: baseDate,
      updatedAt: baseDate,
    });
  });

  it('updateGroup은 전달된 필드만 갱신하고 태그 중복을 제거한다', async () => {
    const input: UpdateRebalancingGroupInput = {
      id: 'group-1',
      name: '업데이트 그룹',
      tagIds: ['tag-2', 'tag-1', 'tag-2'],
    };
    const updatedGroup = buildGroup({
      name: input.name,
      tags: [
        { groupId: 'group-1', tagId: 'tag-2', createdAt: baseDate },
        { groupId: 'group-1', tagId: 'tag-1', createdAt: baseDate },
      ],
    });
    prismaMock.rebalancingGroup.update.mockResolvedValue(updatedGroup);

    const result = await service.updateGroup(input);

    expect(prismaMock.rebalancingGroup.update).toHaveBeenCalledWith({
      where: { id: input.id },
      data: {
        name: input.name,
        tags: {
          deleteMany: {},
          create: [
            { tag: { connect: { id: 'tag-2' } } },
            { tag: { connect: { id: 'tag-1' } } },
          ],
        },
      },
      include: { tags: true },
    });
    expect(result.tagIds).toEqual(['tag-2', 'tag-1']);
  });

  it('deleteGroup은 삭제 성공 시 true를 반환한다', async () => {
    prismaMock.rebalancingGroup.delete.mockResolvedValue({});

    await expect(service.deleteGroup('group-1')).resolves.toBe(true);
    expect(prismaMock.rebalancingGroup.delete).toHaveBeenCalledWith({
      where: { id: 'group-1' },
    });
  });

  it('deleteGroup은 존재하지 않으면 false를 반환한다', async () => {
    const error = createPrismaKnownRequestError('P2025');
    prismaMock.rebalancingGroup.delete.mockRejectedValue(error);

    await expect(service.deleteGroup('group-1')).resolves.toBe(false);
  });

  it('getGroups는 Prisma 결과를 GraphQL 엔티티로 변환한다', async () => {
    const groups = [
      buildGroup(),
      buildGroup({
        id: 'group-2',
        name: '배당 포트폴리오',
        tags: [{ groupId: 'group-2', tagId: 'tag-3', createdAt: baseDate }],
      }),
    ];
    prismaMock.rebalancingGroup.findMany.mockResolvedValue(groups);

    const result = await service.getGroups();

    expect(result).toEqual([
      {
        id: 'group-1',
        name: '성장 포트폴리오',
        description: '기본 설명',
        tagIds: ['tag-1', 'tag-2'],
        createdAt: baseDate,
        updatedAt: baseDate,
      },
      {
        id: 'group-2',
        name: '배당 포트폴리오',
        description: '기본 설명',
        tagIds: ['tag-3'],
        createdAt: baseDate,
        updatedAt: baseDate,
      },
    ]);
  });

  it('getGroup은 ID로 그룹을 조회하고 없으면 null을 반환한다', async () => {
    const group = buildGroup();
    prismaMock.rebalancingGroup.findUnique.mockResolvedValue(group);

    await expect(service.getGroup('group-1')).resolves.toEqual({
      id: 'group-1',
      name: '성장 포트폴리오',
      description: '기본 설명',
      tagIds: ['tag-1', 'tag-2'],
      createdAt: baseDate,
      updatedAt: baseDate,
    });

    prismaMock.rebalancingGroup.findUnique.mockResolvedValue(null);
    await expect(service.getGroup('group-unknown')).resolves.toBeNull();
  });

  it('setTargetAllocations는 그룹을 검증하고 기존 목표를 대체한다', async () => {
    const input: SetTargetAllocationsInput = {
      groupId: 'group-1',
      targets: [
        { tagId: 'tag-1', targetPercentage: 60 },
        { tagId: 'tag-2', targetPercentage: 40 },
      ],
    };
    prismaMock.rebalancingGroup.findUnique.mockResolvedValue(buildGroup());
    const deleteManyMock = jest.fn().mockResolvedValue({ count: 2 });
    const createManyMock = jest.fn().mockResolvedValue({ count: 2 });
    prismaMock.$transaction.mockImplementation(async (callback) =>
      callback({
        targetAllocation: {
          deleteMany: deleteManyMock,
          createMany: createManyMock,
        },
      }),
    );

    await expect(service.setTargetAllocations(input)).resolves.toBe(true);
    expect(deleteManyMock).toHaveBeenCalledWith({
      where: { groupId: input.groupId },
    });
    expect(createManyMock).toHaveBeenCalledWith({
      data: [
        { groupId: input.groupId, tagId: 'tag-1', targetPercentage: 60 },
        { groupId: input.groupId, tagId: 'tag-2', targetPercentage: 40 },
      ],
    });
  });

  it('setTargetAllocations는 목표가 비어 있으면 createMany를 호출하지 않는다', async () => {
    prismaMock.rebalancingGroup.findUnique.mockResolvedValue(buildGroup());
    const deleteManyMock = jest.fn().mockResolvedValue({ count: 0 });
    const createManyMock = jest.fn();
    prismaMock.$transaction.mockImplementation(async (callback) =>
      callback({
        targetAllocation: {
          deleteMany: deleteManyMock,
          createMany: createManyMock,
        },
      }),
    );

    await expect(
      service.setTargetAllocations({ groupId: 'group-1', targets: [] }),
    ).resolves.toBe(true);

    expect(deleteManyMock).toHaveBeenCalledWith({
      where: { groupId: 'group-1' },
    });
    expect(createManyMock).not.toHaveBeenCalled();
  });

  it('setTargetAllocations는 그룹이 없으면 예외를 던진다', async () => {
    prismaMock.rebalancingGroup.findUnique.mockResolvedValue(null);

    await expect(
      service.setTargetAllocations({
        groupId: 'missing',
        targets: [],
      }),
    ).rejects.toThrow('Rebalancing group not found');
  });

  it('setTargetAllocations는 합이 100이 아니면 예외를 던진다', async () => {
    prismaMock.rebalancingGroup.findUnique.mockResolvedValue(buildGroup());

    await expect(
      service.setTargetAllocations({
        groupId: 'group-1',
        targets: [
          { tagId: 'tag-1', targetPercentage: 50 },
          { tagId: 'tag-2', targetPercentage: 40 },
        ],
      }),
    ).rejects.toThrow('Target percentages must sum to 100');
  });

  it('setTargetAllocations는 그룹에 없는 태그가 포함되면 예외를 던진다', async () => {
    prismaMock.rebalancingGroup.findUnique.mockResolvedValue(buildGroup());

    await expect(
      service.setTargetAllocations({
        groupId: 'group-1',
        targets: [
          { tagId: 'tag-1', targetPercentage: 50 },
          { tagId: 'tag-3', targetPercentage: 50 },
        ],
      }),
    ).rejects.toThrow('Invalid tags: tag-3');
  });

  it('getRebalancingAnalysis는 보유 자산과 목표 비중을 기반으로 분석을 생성한다', async () => {
    const group = buildGroup();
    prismaMock.rebalancingGroup.findUnique.mockResolvedValue(group);
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
    const holdings: BrokerageHolding[] = [
      {
        id: 'holding-1',
        symbol: 'SPY',
        name: 'SPDR S&P 500 ETF',
        quantity: 10,
        currentPrice: 500,
        marketValue: 5000,
        averageCost: 450,
        currency: 'USD',
        accountId: 'account-1',
        lastUpdated: baseDate,
      },
      {
        id: 'holding-2',
        symbol: 'QQQ',
        name: 'Invesco QQQ Trust',
        quantity: 5,
        currentPrice: 600,
        marketValue: 3000,
        averageCost: 550,
        currency: 'USD',
        accountId: 'account-1',
        lastUpdated: baseDate,
      },
      {
        id: 'holding-3',
        symbol: 'IWM',
        name: 'iShares Russell 2000 ETF',
        quantity: 4,
        currentPrice: 500,
        marketValue: 2000,
        averageCost: 480,
        currency: 'USD',
        accountId: 'account-2',
        lastUpdated: baseDate,
      },
    ];
    brokerageServiceMock.getHoldings.mockResolvedValue(holdings);
    prismaMock.targetAllocation.findMany.mockResolvedValue([
      {
        id: 'alloc-1',
        groupId: 'group-1',
        tagId: 'tag-1',
        targetPercentage: 60,
      },
      {
        id: 'alloc-2',
        groupId: 'group-1',
        tagId: 'tag-2',
        targetPercentage: 40,
      },
    ]);
    holdingsServiceMock.getHoldingsForTag.mockImplementation(
      async (tagId: string) => {
        if (tagId === 'tag-1') {
          return ['SPY'];
        }
        return ['QQQ', 'IWM'];
      },
    );

    const result = await service.getRebalancingAnalysis('group-1');

    expect(result.groupId).toBe('group-1');
    expect(result.groupName).toBe('성장 포트폴리오');
    expect(result.totalValue).toBe(10000);
    expect(result.allocations).toEqual([
      {
        tagId: 'tag-1',
        tagName: '성장주',
        tagColor: '#ff0000',
        currentValue: 5000,
        currentPercentage: 50,
        targetPercentage: 60,
        difference: 10,
      },
      {
        tagId: 'tag-2',
        tagName: '배당주',
        tagColor: '#00ff00',
        currentValue: 5000,
        currentPercentage: 50,
        targetPercentage: 40,
        difference: -10,
      },
    ]);
    expect(result.lastUpdated).toBeInstanceOf(Date);
  });

  it('getRebalancingAnalysis는 태그 정보가 없으면 해당 항목을 건너뛴다', async () => {
    const group = buildGroup();
    prismaMock.rebalancingGroup.findUnique.mockResolvedValue(group);
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
    const holdings: BrokerageHolding[] = [
      {
        id: 'h1',
        symbol: 'SPY',
        name: 'SPDR S&P 500 ETF',
        quantity: 10,
        currentPrice: 500,
        marketValue: 5000,
        averageCost: 450,
        currency: 'USD',
        accountId: 'account-1',
        lastUpdated: baseDate,
      },
      {
        id: 'h2',
        symbol: 'QQQ',
        name: 'Invesco QQQ Trust',
        quantity: 5,
        currentPrice: 400,
        marketValue: 2000,
        averageCost: 350,
        currency: 'USD',
        accountId: 'account-1',
        lastUpdated: baseDate,
      },
    ];
    brokerageServiceMock.getHoldings.mockResolvedValue(holdings);
    prismaMock.targetAllocation.findMany.mockResolvedValue([
      {
        id: 'alloc-1',
        groupId: 'group-1',
        tagId: 'tag-1',
        targetPercentage: 60,
      },
      {
        id: 'alloc-2',
        groupId: 'group-1',
        tagId: 'tag-2',
        targetPercentage: 40,
      },
    ]);
    holdingsServiceMock.getHoldingsForTag.mockImplementation(async (tagId) => {
      if (tagId === 'tag-1') {
        return ['SPY'];
      }
      return ['QQQ'];
    });

    const analysis = await service.getRebalancingAnalysis('group-1');

    expect(analysis.totalValue).toBe(7000);
    expect(analysis.allocations).toEqual([
      {
        tagId: 'tag-1',
        tagName: '성장주',
        tagColor: '#ff0000',
        currentValue: 5000,
        currentPercentage: (5000 / 7000) * 100,
        targetPercentage: 60,
        difference: 60 - (5000 / 7000) * 100,
      },
    ]);
  });

  it('calculateInvestmentRecommendation은 추가 투자금에 대한 권장 금액을 계산한다', async () => {
    const analysis: RebalancingAnalysis = {
      groupId: 'group-1',
      groupName: '성장 포트폴리오',
      totalValue: 10000,
      allocations: [
        {
          tagId: 'tag-1',
          tagName: '성장주',
          tagColor: '#ff0000',
          currentValue: 5000,
          currentPercentage: 50,
          targetPercentage: 60,
          difference: 10,
        },
        {
          tagId: 'tag-2',
          tagName: '배당주',
          tagColor: '#00ff00',
          currentValue: 5000,
          currentPercentage: 50,
          targetPercentage: 40,
          difference: -10,
        },
      ],
      lastUpdated: new Date('2024-01-05T00:00:00Z'),
    };
    jest.spyOn(service, 'getRebalancingAnalysis').mockResolvedValue(analysis);
    holdingsServiceMock.getHoldingsForTag.mockImplementation(
      async (tagId: string) => {
        if (tagId === 'tag-1') {
          return ['SPY'];
        }
        return ['QQQ'];
      },
    );

    const input: CalculateInvestmentInput = {
      groupId: 'group-1',
      investmentAmount: 2000,
    };

    const result = await service.calculateInvestmentRecommendation(input);

    expect(service.getRebalancingAnalysis).toHaveBeenCalledWith('group-1');
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      tagId: 'tag-1',
      tagName: '성장주',
      recommendedAmount: 2200,
      suggestedSymbols: ['SPY'],
    });
    expect(result[0].recommendedPercentage).toBeCloseTo(110, 5);
    expect(result[1]).toMatchObject({
      tagId: 'tag-2',
      tagName: '배당주',
      recommendedAmount: 0,
      suggestedSymbols: ['QQQ'],
    });
    expect(result[1].recommendedPercentage).toBeCloseTo(0, 5);
  });

  it('calculateInvestmentRecommendation은 투자금이 0이면 비율을 0으로 유지한다', async () => {
    const analysis: RebalancingAnalysis = {
      groupId: 'group-1',
      groupName: '성장 포트폴리오',
      totalValue: 10000,
      allocations: [
        {
          tagId: 'tag-1',
          tagName: '성장주',
          tagColor: '#ff0000',
          currentValue: 5000,
          currentPercentage: 50,
          targetPercentage: 60,
          difference: 10,
        },
        {
          tagId: 'tag-2',
          tagName: '배당주',
          tagColor: '#00ff00',
          currentValue: 5000,
          currentPercentage: 50,
          targetPercentage: 40,
          difference: -10,
        },
      ],
      lastUpdated: new Date('2024-01-05T00:00:00Z'),
    };
    jest.spyOn(service, 'getRebalancingAnalysis').mockResolvedValue(analysis);
    holdingsServiceMock.getHoldingsForTag.mockImplementation(async (tagId) =>
      tagId === 'tag-1' ? ['SPY'] : ['QQQ'],
    );

    const recommendations = await service.calculateInvestmentRecommendation({
      groupId: 'group-1',
      investmentAmount: 0,
    });

    expect(recommendations[0]).toMatchObject({
      tagId: 'tag-1',
      recommendedAmount: 1000,
      recommendedPercentage: 0,
    });
    expect(recommendations[1]).toMatchObject({
      tagId: 'tag-2',
      recommendedAmount: 0,
      recommendedPercentage: 0,
    });
  });
});
