import { BrokerageService } from './brokerage.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateBrokerageAccountInput,
  UpdateBrokerageAccountInput,
} from './brokerage.dto';
import { BrokerageAccount, BrokerageHolding } from './brokerage.entities';
import { createPrismaKnownRequestError } from '../test-utils/prisma-error';

describe('BrokerageService', () => {
  let prismaMock: {
    brokerageAccount: {
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
    };
    brokerageHolding: {
      findMany: jest.Mock;
      deleteMany: jest.Mock;
      createMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let service: BrokerageService;

  beforeAll(() => {
    createPrismaKnownRequestError('P0000');
  });

  const baseDate = new Date('2024-01-01T00:00:00Z');

  beforeEach(() => {
    prismaMock = {
      brokerageAccount: {
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      brokerageHolding: {
        findMany: jest.fn(),
        deleteMany: jest.fn(),
        createMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    service = new BrokerageService(prismaMock as unknown as PrismaService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('createAccount는 입력값을 Prisma 형식으로 변환한다', async () => {
    const input: CreateBrokerageAccountInput = {
      name: '미래에셋 계좌',
      brokerName: '미래에셋',
      apiKey: 'api-key',
    };
    const created: BrokerageAccount = {
      id: 'account-1',
      name: input.name,
      brokerName: input.brokerName,
      description: null,
      isActive: true,
      createdAt: baseDate,
      updatedAt: baseDate,
    } as BrokerageAccount;
    prismaMock.brokerageAccount.create.mockResolvedValue(created);

    const result = await service.createAccount(input);

    expect(prismaMock.brokerageAccount.create).toHaveBeenCalledWith({
      data: {
        name: input.name,
        brokerName: input.brokerName,
        apiKey: input.apiKey,
        description: null,
        apiSecret: null,
        apiBaseUrl: null,
      },
    });
    expect(result).toBe(created);
  });

  it('updateAccount는 제공된 필드만 업데이트한다', async () => {
    const input: UpdateBrokerageAccountInput = {
      id: 'account-1',
      name: '새 이름',
      apiBaseUrl: 'https://api.example.com',
      description: '새 설명',
    };
    const updated: BrokerageAccount = {
      id: input.id,
      name: input.name!,
      brokerName: '미래에셋',
      description: input.description!,
      isActive: true,
      createdAt: baseDate,
      updatedAt: baseDate,
    } as BrokerageAccount;
    prismaMock.brokerageAccount.update.mockResolvedValue(updated);

    const result = await service.updateAccount(input);

    expect(prismaMock.brokerageAccount.update).toHaveBeenCalledWith({
      where: { id: input.id },
      data: {
        name: input.name,
        apiBaseUrl: input.apiBaseUrl,
        description: input.description,
      },
    });
    expect(result).toBe(updated);
  });

  it('updateAccount는 선택 필드가 undefined이면 Prisma 데이터에서 제외한다', async () => {
    const input = {
      id: 'account-2',
      name: '다른 이름',
      apiKey: undefined,
      apiSecret: undefined,
      apiBaseUrl: undefined,
      description: undefined,
    } as UpdateBrokerageAccountInput;
    const updated: BrokerageAccount = {
      id: input.id,
      name: input.name!,
      brokerName: '브로커',
      description: '설명',
      isActive: true,
      createdAt: baseDate,
      updatedAt: baseDate,
    } as BrokerageAccount;
    prismaMock.brokerageAccount.update.mockResolvedValue(updated);

    const result = await service.updateAccount(input);

    expect(prismaMock.brokerageAccount.update).toHaveBeenCalledWith({
      where: { id: input.id },
      data: {
        name: input.name,
      },
    });
    expect(result).toBe(updated);
  });

  it('updateAccount는 null이 전달된 선택 필드를 null로 변환한다', async () => {
    const input = {
      id: 'account-3',
      apiKey: null,
      apiSecret: null,
      apiBaseUrl: null,
      description: null,
    } as unknown as UpdateBrokerageAccountInput;
    const updated: BrokerageAccount = {
      id: input.id,
      name: '이름',
      brokerName: '브로커',
      description: null,
      isActive: true,
      createdAt: baseDate,
      updatedAt: baseDate,
    } as BrokerageAccount;
    prismaMock.brokerageAccount.update.mockResolvedValue(updated);

    const result = await service.updateAccount(input);

    expect(prismaMock.brokerageAccount.update).toHaveBeenCalledWith({
      where: { id: input.id },
      data: {
        apiKey: null,
        apiSecret: null,
        apiBaseUrl: null,
        description: null,
      },
    });
    expect(result).toBe(updated);
  });

  it('deleteAccount는 삭제 성공 시 true를 반환한다', async () => {
    prismaMock.brokerageAccount.delete.mockResolvedValue({});

    await expect(service.deleteAccount('account-1')).resolves.toBe(true);
    expect(prismaMock.brokerageAccount.delete).toHaveBeenCalledWith({
      where: { id: 'account-1' },
    });
  });

  it('deleteAccount는 대상이 없으면 false를 반환한다', async () => {
    const error = createPrismaKnownRequestError('P2025');
    prismaMock.brokerageAccount.delete.mockRejectedValue(error);

    await expect(service.deleteAccount('account-1')).resolves.toBe(false);
  });

  it('getAccounts는 모든 계좌를 정렬하여 반환한다', async () => {
    const accounts: BrokerageAccount[] = [
      {
        id: 'account-1',
        name: 'A',
        brokerName: '증권사',
        description: null,
        isActive: true,
        createdAt: baseDate,
        updatedAt: baseDate,
      } as BrokerageAccount,
    ];
    prismaMock.brokerageAccount.findMany.mockResolvedValue(accounts);

    await expect(service.getAccounts()).resolves.toBe(accounts);
    expect(prismaMock.brokerageAccount.findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: 'asc' },
    });
  });

  it('getAccount는 ID로 단일 계좌를 조회한다', async () => {
    const account: BrokerageAccount = {
      id: 'account-1',
      name: '계좌',
      brokerName: '증권사',
      description: null,
      isActive: true,
      createdAt: baseDate,
      updatedAt: baseDate,
    } as BrokerageAccount;
    prismaMock.brokerageAccount.findUnique.mockResolvedValue(account);

    await expect(service.getAccount('account-1')).resolves.toBe(account);
    expect(prismaMock.brokerageAccount.findUnique).toHaveBeenCalledWith({
      where: { id: 'account-1' },
    });
  });

  it('getHoldings는 계좌 ID 유무에 따라 조건을 적용한다', async () => {
    const holdings: BrokerageHolding[] = [];
    prismaMock.brokerageHolding.findMany.mockResolvedValue(holdings);

    await service.getHoldings();
    expect(prismaMock.brokerageHolding.findMany).toHaveBeenCalledWith({
      where: undefined,
      orderBy: { symbol: 'asc' },
    });

    prismaMock.brokerageHolding.findMany.mockClear();
    prismaMock.brokerageHolding.findMany.mockResolvedValue(holdings);

    await service.getHoldings('account-1');
    expect(prismaMock.brokerageHolding.findMany).toHaveBeenCalledWith({
      where: { accountId: 'account-1' },
      orderBy: { symbol: 'asc' },
    });
  });

  it('refreshHoldings는 계좌가 없으면 예외를 던진다', async () => {
    prismaMock.brokerageAccount.findUnique.mockResolvedValue(null);

    await expect(service.refreshHoldings('missing')).rejects.toThrow(
      'Account not found',
    );
  });

  it('refreshHoldings는 보유 내역을 모의 데이터로 갱신한다', async () => {
    const now = new Date('2024-01-03T00:00:00Z');
    jest.useFakeTimers().setSystemTime(now);

    const account: BrokerageAccount = {
      id: 'account-1',
      name: '계좌',
      brokerName: '증권사',
      description: null,
      isActive: true,
      createdAt: baseDate,
      updatedAt: baseDate,
    } as BrokerageAccount;
    prismaMock.brokerageAccount.findUnique.mockResolvedValue(account);

    const deleteManyResult = { count: 2 };
    const createManyResult = { count: 2 };
    prismaMock.brokerageHolding.deleteMany.mockResolvedValue(deleteManyResult);
    prismaMock.brokerageHolding.createMany.mockResolvedValue(createManyResult);

    const refreshedHoldings: BrokerageHolding[] = [
      {
        id: 'account-1-holding-1',
        symbol: 'SPY',
        name: 'SPDR S&P 500 ETF',
        quantity: 10,
        currentPrice: 425.5,
        marketValue: 4255,
        averageCost: 420,
        currency: 'USD',
        accountId: 'account-1',
        lastUpdated: now,
      },
    ];
    prismaMock.brokerageHolding.findMany.mockResolvedValue(refreshedHoldings);

    prismaMock.$transaction.mockImplementation((operations: unknown) => {
      if (Array.isArray(operations)) {
        return Promise.all(operations);
      }
      return Promise.resolve();
    });

    const result = await service.refreshHoldings('account-1');

    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    const [operations] = prismaMock.$transaction.mock.calls[0];
    expect(Array.isArray(operations)).toBe(true);
    expect(operations).toHaveLength(2);

    expect(prismaMock.brokerageHolding.deleteMany).toHaveBeenCalledWith({
      where: { accountId: 'account-1' },
    });
    expect(prismaMock.brokerageHolding.createMany).toHaveBeenCalledWith({
      data: [
        {
          id: 'account-1-holding-1',
          symbol: 'SPY',
          name: 'SPDR S&P 500 ETF Trust',
          quantity: 10,
          currentPrice: 425.5,
          marketValue: 4255,
          averageCost: 420,
          currency: 'USD',
          accountId: 'account-1',
          lastUpdated: now,
        },
        {
          id: 'account-1-holding-2',
          symbol: 'VTI',
          name: 'Vanguard Total Stock Market ETF',
          quantity: 5,
          currentPrice: 248.3,
          marketValue: 1241.5,
          averageCost: 245,
          currency: 'USD',
          accountId: 'account-1',
          lastUpdated: now,
        },
      ],
    });
    expect(result).toBe(refreshedHoldings);
    expect(prismaMock.brokerageHolding.findMany).toHaveBeenCalledWith({
      where: { accountId: 'account-1' },
      orderBy: { symbol: 'asc' },
    });
  });
});
