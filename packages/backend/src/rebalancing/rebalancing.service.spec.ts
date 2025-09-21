import { BadRequestException } from '@nestjs/common';
import { RebalancingService } from './rebalancing.service';
import { PrismaService } from '../prisma/prisma.service';
import { BrokerageService } from '../brokerage/brokerage.service';
import { HoldingsService } from '../holdings/holdings.service';
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
  description: overrides.description ?? '기본 설명',
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
  let brokerageServiceMock: jest.Mocked<BrokerageService>;
  let holdingsServiceMock: jest.Mocked<HoldingsService>;
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

    brokerageServiceMock = {
      getHoldings: jest.fn(),
    } as unknown as jest.Mocked<BrokerageService>;

    holdingsServiceMock = {
      getHoldingsForTag: jest.fn(),
    } as unknown as jest.Mocked<HoldingsService>;

    service = new RebalancingService(
      prismaMock as unknown as PrismaService,
      brokerageServiceMock,
      holdingsServiceMock,
    );
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

  it('updateGroup은 그룹 소유 여부를 확인하고 태그를 갱신한다', async () => {
    const input: UpdateRebalancingGroupInput = {
      id: 'group-1',
      name: '수정된 그룹',
      tagIds: ['tag-2', 'tag-3'],
    };
    prismaMock.rebalancingGroup.findFirst.mockResolvedValue(buildGroup());
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

  it('getRebalancingAnalysis는 사용자 데이터를 기반으로 분석을 생성한다', async () => {
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
    brokerageServiceMock.getHoldings.mockResolvedValue([
      {
        id: 'holding-1',
        symbol: 'SPY',
        name: 'SPY',
        quantity: 1,
        currentPrice: 100,
        marketValue: 100,
        averageCost: null,
        currency: 'USD',
        accountId: 'acc-1',
        lastUpdated: baseDate,
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

    expect(brokerageServiceMock.getHoldings).toHaveBeenCalledWith(USER_ID);
    expect(analysis.totalValue).toBe(100);
    expect(analysis.allocations).toHaveLength(2);
  });

  it('calculateInvestmentRecommendation는 분석 결과를 기반으로 추천을 생성한다', async () => {
    const analysis = {
      groupId: 'group-1',
      groupName: '성장 포트폴리오',
      totalValue: 100,
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
  });
});
