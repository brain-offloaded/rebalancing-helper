import { BrokerageResolver } from './brokerage.resolver';
import { BrokerageService } from './brokerage.service';
import {
  CreateBrokerageAccountInput,
  UpdateBrokerageAccountInput,
} from './brokerage.dto';
import { BrokerageAccount, BrokerageHolding } from './brokerage.entities';

const createAccount = (overrides: Partial<BrokerageAccount> = {}): BrokerageAccount => ({
  id: overrides.id ?? 'account-1',
  name: overrides.name ?? '기본 계좌',
  brokerName: overrides.brokerName ?? '브로커',
  description: overrides.description ?? null,
  isActive: overrides.isActive ?? true,
  createdAt: overrides.createdAt ?? new Date('2024-01-01T00:00:00Z'),
  updatedAt: overrides.updatedAt ?? new Date('2024-01-02T00:00:00Z'),
});

const createHolding = (
  overrides: Partial<BrokerageHolding> = {},
): BrokerageHolding => ({
  id: overrides.id ?? 'holding-1',
  symbol: overrides.symbol ?? 'SPY',
  name: overrides.name ?? 'S&P 500 ETF',
  quantity: overrides.quantity ?? 1,
  currentPrice: overrides.currentPrice ?? 100,
  marketValue: overrides.marketValue ?? 100,
  averageCost: overrides.averageCost ?? null,
  currency: overrides.currency ?? 'USD',
  accountId: overrides.accountId ?? 'account-1',
  lastUpdated: overrides.lastUpdated ?? new Date('2024-01-02T00:00:00Z'),
});

describe('BrokerageResolver', () => {
  let resolver: BrokerageResolver;
  let service: jest.Mocked<BrokerageService>;

  beforeEach(() => {
    service = {
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

  it('brokerageAccounts는 서비스의 계좌 조회 결과를 반환한다', async () => {
    const accounts = [createAccount()];
    service.getAccounts.mockResolvedValue(accounts);

    await expect(resolver.brokerageAccounts()).resolves.toBe(accounts);
    expect(service.getAccounts).toHaveBeenCalledTimes(1);
  });

  it('brokerageAccount는 ID로 단일 계좌를 조회한다', async () => {
    const account = createAccount({ id: 'account-42' });
    service.getAccount.mockResolvedValue(account);

    await expect(resolver.brokerageAccount('account-42')).resolves.toBe(account);
    expect(service.getAccount).toHaveBeenCalledWith('account-42');
  });

  it('brokerageHoldings는 accountId가 없으면 undefined로 위임한다', async () => {
    const holdings = [createHolding()];
    service.getHoldings.mockResolvedValue(holdings);

    await expect(resolver.brokerageHoldings()).resolves.toBe(holdings);
    expect(service.getHoldings).toHaveBeenCalledWith(undefined);
  });

  it('brokerageHoldings는 accountId가 있으면 해당 값으로 위임한다', async () => {
    const holdings = [createHolding({ accountId: 'account-7' })];
    service.getHoldings.mockResolvedValue(holdings);

    await expect(resolver.brokerageHoldings('account-7')).resolves.toBe(holdings);
    expect(service.getHoldings).toHaveBeenCalledWith('account-7');
  });

  it('createBrokerageAccount는 입력값을 서비스로 전달한다', async () => {
    const input: CreateBrokerageAccountInput = {
      name: '새 계좌',
      brokerName: '새 브로커',
      apiKey: 'api-key',
    };
    const account = createAccount({ name: input.name, brokerName: input.brokerName });
    service.createAccount.mockResolvedValue(account);

    await expect(resolver.createBrokerageAccount(input)).resolves.toBe(account);
    expect(service.createAccount).toHaveBeenCalledWith(input);
  });

  it('updateBrokerageAccount는 수정 입력을 위임한다', async () => {
    const input: UpdateBrokerageAccountInput = {
      id: 'account-1',
      name: '변경된 이름',
    };
    const account = createAccount({ name: input.name });
    service.updateAccount.mockResolvedValue(account);

    await expect(resolver.updateBrokerageAccount(input)).resolves.toBe(account);
    expect(service.updateAccount).toHaveBeenCalledWith(input);
  });

  it('deleteBrokerageAccount는 삭제 여부를 반환한다', async () => {
    service.deleteAccount.mockResolvedValue(true);

    await expect(resolver.deleteBrokerageAccount('account-1')).resolves.toBe(true);
    expect(service.deleteAccount).toHaveBeenCalledWith('account-1');
  });

  it('refreshBrokerageHoldings는 최신 보유 내역을 반환한다', async () => {
    const holdings = [createHolding({ accountId: 'account-1' })];
    service.refreshHoldings.mockResolvedValue(holdings);

    await expect(resolver.refreshBrokerageHoldings('account-1')).resolves.toBe(
      holdings,
    );
    expect(service.refreshHoldings).toHaveBeenCalledWith('account-1');
  });
});
