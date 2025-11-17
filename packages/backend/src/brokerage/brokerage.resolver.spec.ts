import { BrokerageResolver } from './brokerage.resolver';
import { BrokerageService } from './brokerage.service';
import {
  CreateBrokerInput,
  CreateBrokerageAccountInput,
  UpdateBrokerInput,
  UpdateBrokerageAccountInput,
} from './brokerage.dto';
import {
  Broker,
  BrokerageAccount,
  BrokerageAccountSyncMode,
} from './brokerage.entities';
import { Holding, HoldingSource } from '../holdings/holdings.entities';
import { ActiveUserData } from '../auth/auth.types';

const mockUser: ActiveUserData = {
  userId: 'user-1',
  email: 'demo@example.com',
};

const createAccount = (
  overrides: Partial<BrokerageAccount> = {},
): BrokerageAccount => ({
  id: overrides.id ?? 'account-1',
  name: overrides.name ?? '기본 계좌',
  brokerId: overrides.brokerId ?? 'broker-1',
  syncMode: overrides.syncMode ?? BrokerageAccountSyncMode.MANUAL,
  description: overrides.description ?? null,
  isActive: overrides.isActive ?? true,
  broker:
    overrides.broker ??
    ({
      id: 'broker-1',
      code: 'B001',
      name: '브로커',
      description: null,
      apiBaseUrl: null,
      isActive: true,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-02T00:00:00Z'),
    } as Broker),
  createdAt: overrides.createdAt ?? new Date('2024-01-01T00:00:00Z'),
  updatedAt: overrides.updatedAt ?? new Date('2024-01-02T00:00:00Z'),
});

const createBroker = (overrides: Partial<Broker> = {}): Broker => ({
  id: overrides.id ?? 'broker-1',
  code: overrides.code ?? 'B001',
  name: overrides.name ?? '브로커',
  description: overrides.description ?? null,
  apiBaseUrl: overrides.apiBaseUrl ?? null,
  isActive: overrides.isActive ?? true,
  createdAt: overrides.createdAt ?? new Date('2024-01-01T00:00:00Z'),
  updatedAt: overrides.updatedAt ?? new Date('2024-01-02T00:00:00Z'),
});

const createHolding = (overrides: Partial<Holding> = {}): Holding => ({
  id: overrides.id ?? 'holding-1',
  source: overrides.source ?? HoldingSource.BROKERAGE,
  accountId: overrides.accountId ?? 'account-1',
  market: overrides.market ?? null,
  symbol: overrides.symbol ?? 'SPY',
  name: overrides.name ?? 'S&P 500 ETF',
  alias: overrides.alias ?? null,
  quantity: overrides.quantity ?? 1,
  currentPrice: overrides.currentPrice ?? 100,
  marketValue: overrides.marketValue ?? 100,
  currency: overrides.currency ?? 'USD',
  lastTradedAt: overrides.lastTradedAt ?? new Date('2024-01-02T00:00:00Z'),
  createdAt: overrides.createdAt ?? new Date('2024-01-01T00:00:00Z'),
  updatedAt: overrides.updatedAt ?? new Date('2024-01-02T00:00:00Z'),
});

describe('BrokerageResolver', () => {
  let resolver: BrokerageResolver;
  let service: jest.Mocked<BrokerageService>;

  beforeEach(() => {
    service = {
      listBrokers: jest.fn(),
      createBroker: jest.fn(),
      updateBroker: jest.fn(),
      deleteBroker: jest.fn(),
      getAccounts: jest.fn(),
      getAccount: jest.fn(),
      getHoldings: jest.fn(),
      createAccount: jest.fn(),
      updateAccount: jest.fn(),
      deleteAccount: jest.fn(),
      refreshHoldings: jest.fn(),
    } as unknown as jest.Mocked<BrokerageService>;

    resolver = new BrokerageResolver(service);
  });

  it('brokerageAccounts는 사용자별 계좌를 조회한다', async () => {
    const accounts = [createAccount()];
    service.getAccounts.mockResolvedValue(accounts);

    await expect(resolver.brokerageAccounts(mockUser)).resolves.toBe(accounts);
    expect(service.getAccounts).toHaveBeenCalledWith(mockUser.userId);
  });

  it('brokerageAccount는 사용자와 ID를 전달한다', async () => {
    const account = createAccount({ id: 'account-42' });
    service.getAccount.mockResolvedValue(account);

    await expect(
      resolver.brokerageAccount(mockUser, 'account-42'),
    ).resolves.toBe(account);
    expect(service.getAccount).toHaveBeenCalledWith(
      mockUser.userId,
      'account-42',
    );
  });

  it('brokerageHoldings는 사용자와 선택적 accountId로 조회한다', async () => {
    const holdings = [createHolding()];
    service.getHoldings.mockResolvedValue(holdings);

    await expect(resolver.brokerageHoldings(mockUser)).resolves.toBe(holdings);
    expect(service.getHoldings).toHaveBeenCalledWith(
      mockUser.userId,
      undefined,
    );

    service.getHoldings.mockClear();
    service.getHoldings.mockResolvedValue(holdings);

    await expect(
      resolver.brokerageHoldings(mockUser, 'account-1'),
    ).resolves.toBe(holdings);
    expect(service.getHoldings).toHaveBeenCalledWith(
      mockUser.userId,
      'account-1',
    );
  });

  it('createBrokerageAccount는 사용자 ID와 입력을 전달한다', async () => {
    const input: CreateBrokerageAccountInput = {
      name: '새 계좌',
      brokerId: 'broker-1',
      syncMode: BrokerageAccountSyncMode.API,
      apiKey: 'api-key',
    };
    const account = createAccount({ name: input.name });
    service.createAccount.mockResolvedValue(account);

    await expect(
      resolver.createBrokerageAccount(mockUser, input),
    ).resolves.toBe(account);
    expect(service.createAccount).toHaveBeenCalledWith(mockUser.userId, input);
  });

  it('updateBrokerageAccount는 사용자 ID를 포함해 업데이트를 위임한다', async () => {
    const input: UpdateBrokerageAccountInput = {
      id: 'account-1',
      name: '변경된 이름',
    };
    const account = createAccount({ name: input.name });
    service.updateAccount.mockResolvedValue(account);

    await expect(
      resolver.updateBrokerageAccount(mockUser, input),
    ).resolves.toBe(account);
    expect(service.updateAccount).toHaveBeenCalledWith(mockUser.userId, input);
  });

  it('deleteBrokerageAccount는 사용자 ID와 함께 호출한다', async () => {
    service.deleteAccount.mockResolvedValue(true);

    await expect(
      resolver.deleteBrokerageAccount(mockUser, 'account-1'),
    ).resolves.toBe(true);
    expect(service.deleteAccount).toHaveBeenCalledWith(
      mockUser.userId,
      'account-1',
    );
  });

  it('refreshBrokerageHoldings는 사용자 ID를 포함하여 호출한다', async () => {
    const holdings = [createHolding({ accountId: 'account-1' })];
    service.refreshHoldings.mockResolvedValue(holdings);

    await expect(
      resolver.refreshBrokerageHoldings(mockUser, 'account-1'),
    ).resolves.toBe(holdings);
    expect(service.refreshHoldings).toHaveBeenCalledWith(
      mockUser.userId,
      'account-1',
    );
  });

  it('brokers는 서비스의 목록을 반환한다', async () => {
    const brokers = [createBroker()];
    service.listBrokers.mockResolvedValue(brokers);

    await expect(resolver.brokers(mockUser)).resolves.toBe(brokers);
    expect(service.listBrokers).toHaveBeenCalledTimes(1);
  });

  it('createBroker는 입력을 서비스로 전달한다', async () => {
    const input: CreateBrokerInput = {
      code: 'NEW',
      name: '새 증권사',
    };
    const broker = createBroker({ code: input.code, name: input.name });
    service.createBroker.mockResolvedValue(broker);

    await expect(resolver.createBroker(mockUser, input)).resolves.toBe(broker);
    expect(service.createBroker).toHaveBeenCalledWith(input);
  });

  it('updateBroker는 입력을 서비스로 전달한다', async () => {
    const input: UpdateBrokerInput = { id: 'broker-1', name: '수정' };
    const broker = createBroker({ name: '수정' });
    service.updateBroker.mockResolvedValue(broker);

    await expect(resolver.updateBroker(mockUser, input)).resolves.toBe(broker);
    expect(service.updateBroker).toHaveBeenCalledWith(input);
  });

  it('deleteBroker는 삭제 결과를 반환한다', async () => {
    service.deleteBroker.mockResolvedValue(true);

    await expect(resolver.deleteBroker(mockUser, 'broker-1')).resolves.toBe(
      true,
    );
    expect(service.deleteBroker).toHaveBeenCalledWith('broker-1');
  });
});
