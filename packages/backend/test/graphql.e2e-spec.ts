import 'reflect-metadata';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { BrokerageService } from '../src/brokerage/brokerage.service';
import { HoldingsService } from '../src/holdings/holdings.service';
import { TagsService } from '../src/tags/tags.service';
import { RebalancingService } from '../src/rebalancing/rebalancing.service';
import { BrokerageAccount } from '../src/brokerage/brokerage.entities';
import { HoldingTag } from '../src/holdings/holdings.entities';
import { Tag } from '../src/tags/tags.entities';
import {
  RebalancingAnalysis,
  TagAllocation,
  InvestmentRecommendation,
} from '../src/rebalancing/rebalancing.entities';

const prismaMock = {
  onModuleInit: jest.fn(),
  onModuleDestroy: jest.fn(),
  enableShutdownHooks: jest.fn(),
  $connect: jest.fn(),
  $disconnect: jest.fn(),
} satisfies Partial<PrismaService>;

const brokerageServiceMock = {
  getAccounts: jest.fn(),
  getAccount: jest.fn(),
  getHoldings: jest.fn(),
  createAccount: jest.fn(),
  updateAccount: jest.fn(),
  deleteAccount: jest.fn(),
  refreshHoldings: jest.fn(),
} as unknown as jest.Mocked<BrokerageService>;

const holdingsServiceMock = {
  getHoldingTags: jest.fn(),
  getTagsForHolding: jest.fn(),
  getHoldingsForTag: jest.fn(),
  addTag: jest.fn(),
  removeTag: jest.fn(),
  setTags: jest.fn(),
} as unknown as jest.Mocked<HoldingsService>;

const tagsServiceMock = {
  getTags: jest.fn(),
  getTag: jest.fn(),
  createTag: jest.fn(),
  updateTag: jest.fn(),
  deleteTag: jest.fn(),
} as unknown as jest.Mocked<TagsService>;

const rebalancingServiceMock = {
  getGroups: jest.fn(),
  getGroup: jest.fn(),
  getRebalancingAnalysis: jest.fn(),
  createGroup: jest.fn(),
  updateGroup: jest.fn(),
  deleteGroup: jest.fn(),
  setTargetAllocations: jest.fn(),
  calculateInvestmentRecommendation: jest.fn(),
} as unknown as jest.Mocked<RebalancingService>;

describe('GraphQL API (e2e)', () => {
  let app: INestApplication<App>;
  let httpServer: ReturnType<INestApplication['getHttpServer']>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .overrideProvider(BrokerageService)
      .useValue(brokerageServiceMock)
      .overrideProvider(HoldingsService)
      .useValue(holdingsServiceMock)
      .overrideProvider(TagsService)
      .useValue(tagsServiceMock)
      .overrideProvider(RebalancingService)
      .useValue(rebalancingServiceMock)
      .compile();

    app = moduleFixture.createNestApplication<App>();
    await app.init();
    httpServer = app.getHttpServer();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('brokerageAccounts 쿼리는 계좌 목록을 반환한다', async () => {
    const accounts: BrokerageAccount[] = [
      {
        id: 'account-1',
        name: '미래에셋',
        brokerName: '미래에셋증권',
        description: null,
        isActive: true,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-02T00:00:00Z'),
      } as BrokerageAccount,
    ];
    brokerageServiceMock.getAccounts.mockResolvedValue(accounts);

    const query = `
      query {
        brokerageAccounts {
          id
          name
          brokerName
          description
          isActive
          createdAt
          updatedAt
        }
      }
    `;

    const response = await request(httpServer).post('/graphql').send({ query });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data).toEqual({
      brokerageAccounts: [
        {
          id: 'account-1',
          name: '미래에셋',
          brokerName: '미래에셋증권',
          description: null,
          isActive: true,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-02T00:00:00.000Z',
        },
      ],
    });
    expect(brokerageServiceMock.getAccounts).toHaveBeenCalledTimes(1);
  });

  it('createBrokerageAccount 뮤테이션은 서비스로 입력을 전달한다', async () => {
    const account: BrokerageAccount = {
      id: 'account-2',
      name: '새 계좌',
      brokerName: '브로커',
      description: null,
      isActive: true,
      createdAt: new Date('2024-01-03T00:00:00Z'),
      updatedAt: new Date('2024-01-03T00:00:00Z'),
    } as BrokerageAccount;
    brokerageServiceMock.createAccount.mockResolvedValue(account);

    const mutation = `
      mutation ($input: CreateBrokerageAccountInput!) {
        createBrokerageAccount(input: $input) {
          id
          name
          brokerName
        }
      }
    `;
    const variables = {
      input: {
        name: '새 계좌',
        brokerName: '브로커',
        apiKey: 'api-key',
      },
    };

    const response = await request(httpServer)
      .post('/graphql')
      .send({ query: mutation, variables });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data).toEqual({
      createBrokerageAccount: {
        id: 'account-2',
        name: '새 계좌',
        brokerName: '브로커',
      },
    });
    expect(brokerageServiceMock.createAccount).toHaveBeenCalledWith(variables.input);
  });

  it('holdingTags 쿼리는 보유 종목 태그를 반환한다', async () => {
    const tags: HoldingTag[] = [
      {
        id: 'holding-tag-1',
        holdingSymbol: 'SPY',
        tagId: 'tag-1',
        createdAt: new Date('2024-01-01T00:00:00Z'),
      } as HoldingTag,
    ];
    holdingsServiceMock.getHoldingTags.mockResolvedValue(tags);

    const query = `
      query ($symbol: String) {
        holdingTags(holdingSymbol: $symbol) {
          id
          holdingSymbol
          tagId
          createdAt
        }
      }
    `;

    const response = await request(httpServer)
      .post('/graphql')
      .send({ query, variables: { symbol: 'SPY' } });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data).toEqual({
      holdingTags: [
        {
          id: 'holding-tag-1',
          holdingSymbol: 'SPY',
          tagId: 'tag-1',
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      ],
    });
    expect(holdingsServiceMock.getHoldingTags).toHaveBeenCalledWith('SPY');
  });

  it('setHoldingTags 뮤테이션은 최신 태그 목록을 반환한다', async () => {
    const tags: HoldingTag[] = [
      {
        id: 'holding-tag-2',
        holdingSymbol: 'QQQ',
        tagId: 'tag-2',
        createdAt: new Date('2024-01-02T00:00:00Z'),
      } as HoldingTag,
    ];
    holdingsServiceMock.setTags.mockResolvedValue(tags);

    const mutation = `
      mutation ($input: SetHoldingTagsInput!) {
        setHoldingTags(input: $input) {
          id
          holdingSymbol
          tagId
        }
      }
    `;
    const variables = {
      input: {
        holdingSymbol: 'QQQ',
        tagIds: ['tag-2'],
      },
    };

    const response = await request(httpServer)
      .post('/graphql')
      .send({ query: mutation, variables });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data).toEqual({
      setHoldingTags: [
        {
          id: 'holding-tag-2',
          holdingSymbol: 'QQQ',
          tagId: 'tag-2',
        },
      ],
    });
    expect(holdingsServiceMock.setTags).toHaveBeenCalledWith(variables.input);
  });

  it('rebalancingAnalysis 쿼리는 리밸런싱 분석 정보를 반환한다', async () => {
    const allocations: TagAllocation[] = [
      {
        tagId: 'tag-1',
        tagName: '성장주',
        tagColor: '#ff0000',
        currentValue: 500,
        currentPercentage: 0.5,
        targetPercentage: 0.6,
        difference: 0.1,
      },
    ];
    const analysis: RebalancingAnalysis = {
      groupId: 'group-1',
      groupName: '테스트 그룹',
      totalValue: 1000,
      allocations,
      lastUpdated: new Date('2024-01-04T00:00:00Z'),
    } as RebalancingAnalysis;
    rebalancingServiceMock.getRebalancingAnalysis.mockResolvedValue(analysis);

    const query = `
      query ($groupId: String!) {
        rebalancingAnalysis(groupId: $groupId) {
          groupId
          groupName
          totalValue
          allocations {
            tagId
            targetPercentage
            difference
          }
          lastUpdated
        }
      }
    `;

    const response = await request(httpServer)
      .post('/graphql')
      .send({ query, variables: { groupId: 'group-1' } });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data).toEqual({
      rebalancingAnalysis: {
        groupId: 'group-1',
        groupName: '테스트 그룹',
        totalValue: 1000,
        allocations: [
          {
            tagId: 'tag-1',
            targetPercentage: 0.6,
            difference: 0.1,
          },
        ],
        lastUpdated: '2024-01-04T00:00:00.000Z',
      },
    });
    expect(rebalancingServiceMock.getRebalancingAnalysis).toHaveBeenCalledWith('group-1');
  });

  it('updateTag 뮤테이션은 태그 정보를 갱신한다', async () => {
    const tag: Tag = {
      id: 'tag-3',
      name: '배당주',
      description: '안정적',
      color: '#00ff00',
      createdAt: new Date('2024-01-05T00:00:00Z'),
      updatedAt: new Date('2024-01-05T00:00:00Z'),
    } as Tag;
    tagsServiceMock.updateTag.mockResolvedValue(tag);

    const mutation = `
      mutation ($input: UpdateTagInput!) {
        updateTag(input: $input) {
          id
          name
          description
          color
        }
      }
    `;
    const variables = {
      input: {
        id: 'tag-3',
        name: '배당주',
        description: '안정적',
        color: '#00ff00',
      },
    };

    const response = await request(httpServer)
      .post('/graphql')
      .send({ query: mutation, variables });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data).toEqual({
      updateTag: {
        id: 'tag-3',
        name: '배당주',
        description: '안정적',
        color: '#00ff00',
      },
    });
    expect(tagsServiceMock.updateTag).toHaveBeenCalledWith(variables.input);
  });

  it('investmentRecommendation 쿼리는 추천 내역을 반환한다', async () => {
    const recommendations: InvestmentRecommendation[] = [
      {
        tagId: 'tag-1',
        tagName: '성장주',
        recommendedAmount: 600,
        recommendedPercentage: 0.6,
        suggestedSymbols: ['SPY', 'QQQ'],
      },
    ];
    rebalancingServiceMock.calculateInvestmentRecommendation.mockResolvedValue(
      recommendations,
    );

    const query = `
      query ($input: CalculateInvestmentInput!) {
        investmentRecommendation(input: $input) {
          tagId
          tagName
          recommendedAmount
          recommendedPercentage
          suggestedSymbols
        }
      }
    `;

    const response = await request(httpServer)
      .post('/graphql')
      .send({
        query,
        variables: { input: { groupId: 'group-1', investmentAmount: 1000 } },
      });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data).toEqual({
      investmentRecommendation: [
        {
          tagId: 'tag-1',
          tagName: '성장주',
          recommendedAmount: 600,
          recommendedPercentage: 0.6,
          suggestedSymbols: ['SPY', 'QQQ'],
        },
      ],
    });
    expect(rebalancingServiceMock.calculateInvestmentRecommendation).toHaveBeenCalledWith({
      groupId: 'group-1',
      investmentAmount: 1000,
    });
  });
});
