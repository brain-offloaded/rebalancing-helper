import { HoldingsResolver } from './holdings.resolver';
import { HoldingsService } from './holdings.service';
import {
  AddHoldingTagInput,
  RemoveHoldingTagInput,
  SetHoldingTagsInput,
  CreateManualHoldingInput,
  IncreaseManualHoldingInput,
  SetManualHoldingQuantityInput,
  ManualHoldingIdentifierInput,
} from './holdings.dto';
import { HoldingTag, Holding, HoldingSource } from './holdings.entities';
import { ActiveUserData } from '../auth/auth.types';

const mockUser: ActiveUserData = {
  userId: 'user-1',
  email: 'demo@example.com',
};

const createHoldingTag = (overrides: Partial<HoldingTag> = {}): HoldingTag => ({
  id: overrides.id ?? 'holding-tag-1',
  holdingSymbol: overrides.holdingSymbol ?? 'SPY',
  tagId: overrides.tagId ?? 'tag-1',
  createdAt: overrides.createdAt ?? new Date('2024-01-01T00:00:00Z'),
});

const createHolding = (overrides: Partial<Holding> = {}): Holding => ({
  id: overrides.id ?? 'holding-1',
  source: overrides.source ?? HoldingSource.MANUAL,
  accountId: overrides.accountId ?? null,
  market: overrides.market ?? 'US',
  symbol: overrides.symbol ?? 'VOO',
  name: overrides.name ?? 'Vanguard S&P 500 ETF',
  quantity: overrides.quantity ?? 3,
  currentPrice: overrides.currentPrice ?? 410.2,
  marketValue:
    overrides.marketValue ??
    (overrides.quantity ?? 3) * (overrides.currentPrice ?? 410.2),
  currency: overrides.currency ?? 'USD',
  lastUpdated: overrides.lastUpdated ?? new Date('2024-01-03T00:00:00Z'),
  createdAt: overrides.createdAt ?? new Date('2024-01-02T00:00:00Z'),
  updatedAt: overrides.updatedAt ?? new Date('2024-01-03T00:00:00Z'),
});

describe('HoldingsResolver', () => {
  let resolver: HoldingsResolver;
  let service: jest.Mocked<HoldingsService>;

  beforeEach(() => {
    service = {
      getHoldingTags: jest.fn(),
      getTagsForHolding: jest.fn(),
      getHoldingsForTag: jest.fn(),
      addTag: jest.fn(),
      removeTag: jest.fn(),
      setTags: jest.fn(),
      getHoldings: jest.fn(),
      createManualHolding: jest.fn(),
      increaseManualHolding: jest.fn(),
      setManualHoldingQuantity: jest.fn(),
      deleteManualHolding: jest.fn(),
      syncManualHoldingPrice: jest.fn(),
    } as unknown as jest.Mocked<HoldingsService>;

    resolver = new HoldingsResolver(service);
  });

  it('holdingTags는 사용자 ID와 함께 조회한다', async () => {
    const tags = [createHoldingTag()];
    service.getHoldingTags.mockResolvedValue(tags);

    await expect(resolver.holdingTags(mockUser)).resolves.toBe(tags);
    expect(service.getHoldingTags).toHaveBeenCalledWith(
      mockUser.userId,
      undefined,
    );

    service.getHoldingTags.mockClear();
    service.getHoldingTags.mockResolvedValue(tags);

    await expect(resolver.holdingTags(mockUser, 'QQQ')).resolves.toBe(tags);
    expect(service.getHoldingTags).toHaveBeenCalledWith(mockUser.userId, 'QQQ');
  });

  it('tagsForHolding은 사용자 ID를 전달한다', async () => {
    const tagIds = ['tag-1', 'tag-2'];
    service.getTagsForHolding.mockResolvedValue(tagIds);

    await expect(resolver.tagsForHolding(mockUser, 'SPY')).resolves.toBe(
      tagIds,
    );
    expect(service.getTagsForHolding).toHaveBeenCalledWith(
      mockUser.userId,
      'SPY',
    );
  });

  it('holdingsForTag는 사용자 ID 기반으로 호출된다', async () => {
    const symbols = ['SPY'];
    service.getHoldingsForTag.mockResolvedValue(symbols);

    await expect(resolver.holdingsForTag(mockUser, 'tag-1')).resolves.toBe(
      symbols,
    );
    expect(service.getHoldingsForTag).toHaveBeenCalledWith(
      mockUser.userId,
      'tag-1',
    );
  });

  it('addHoldingTag는 사용자 ID와 입력을 전달한다', async () => {
    const input: AddHoldingTagInput = {
      holdingSymbol: 'SPY',
      tagId: 'tag-1',
    };
    const tag = createHoldingTag({
      holdingSymbol: input.holdingSymbol,
      tagId: input.tagId,
    });
    service.addTag.mockResolvedValue(tag);

    await expect(resolver.addHoldingTag(mockUser, input)).resolves.toBe(tag);
    expect(service.addTag).toHaveBeenCalledWith(mockUser.userId, input);
  });

  it('removeHoldingTag는 사용자 ID를 포함하여 호출한다', async () => {
    const input: RemoveHoldingTagInput = {
      holdingSymbol: 'SPY',
      tagId: 'tag-1',
    };
    service.removeTag.mockResolvedValue(true);

    await expect(resolver.removeHoldingTag(mockUser, input)).resolves.toBe(
      true,
    );
    expect(service.removeTag).toHaveBeenCalledWith(mockUser.userId, input);
  });

  it('setHoldingTags는 사용자 ID와 입력을 전달한다', async () => {
    const input: SetHoldingTagsInput = {
      holdingSymbol: 'SPY',
      tagIds: ['tag-1', 'tag-2'],
    };
    const tags = [
      createHoldingTag({ holdingSymbol: input.holdingSymbol, tagId: 'tag-1' }),
    ];
    service.setTags.mockResolvedValue(tags);

    await expect(resolver.setHoldingTags(mockUser, input)).resolves.toBe(tags);
    expect(service.setTags).toHaveBeenCalledWith(mockUser.userId, input);
  });

  it('holdings는 사용자 ID로 전체 보유 종목을 조회한다', async () => {
    const holdings = [createHolding({ source: HoldingSource.BROKERAGE })];
    service.getHoldings.mockResolvedValue(holdings);

    await expect(resolver.holdings(mockUser)).resolves.toBe(holdings);
    expect(service.getHoldings).toHaveBeenCalledWith(mockUser.userId, {
      source: undefined,
      accountId: undefined,
    });
  });

  it('holdings는 필터를 전달한다', async () => {
    const holdings = [createHolding({ source: HoldingSource.MANUAL })];
    service.getHoldings.mockResolvedValue(holdings);

    await expect(
      resolver.holdings(mockUser, HoldingSource.MANUAL, 'account-1'),
    ).resolves.toBe(holdings);
    expect(service.getHoldings).toHaveBeenCalledWith(mockUser.userId, {
      source: HoldingSource.MANUAL,
      accountId: 'account-1',
    });
  });

  it('createManualHolding은 사용자 ID와 입력값을 전달한다', async () => {
    const input: CreateManualHoldingInput = {
      market: 'US',
      symbol: 'VOO',
      quantity: 2,
    };
    const manualHolding = createHolding({ quantity: 2 });
    service.createManualHolding.mockResolvedValue(manualHolding);

    await expect(resolver.createManualHolding(mockUser, input)).resolves.toBe(
      manualHolding,
    );
    expect(service.createManualHolding).toHaveBeenCalledWith(
      mockUser.userId,
      input,
    );
  });

  it('increaseManualHolding은 사용자 ID와 입력값을 전달한다', async () => {
    const input: IncreaseManualHoldingInput = {
      market: 'US',
      symbol: 'VOO',
      quantityDelta: 1,
    };
    const manualHolding = createHolding({ quantity: 4 });
    service.increaseManualHolding.mockResolvedValue(manualHolding);

    await expect(resolver.increaseManualHolding(mockUser, input)).resolves.toBe(
      manualHolding,
    );
    expect(service.increaseManualHolding).toHaveBeenCalledWith(
      mockUser.userId,
      input,
    );
  });

  it('setManualHoldingQuantity는 사용자 ID와 입력값을 전달한다', async () => {
    const input: SetManualHoldingQuantityInput = {
      market: 'US',
      symbol: 'VOO',
      quantity: 5,
    };
    const manualHolding = createHolding({ quantity: 5 });
    service.setManualHoldingQuantity.mockResolvedValue(manualHolding);

    await expect(
      resolver.setManualHoldingQuantity(mockUser, input),
    ).resolves.toBe(manualHolding);
    expect(service.setManualHoldingQuantity).toHaveBeenCalledWith(
      mockUser.userId,
      input,
    );
  });

  it('deleteManualHolding은 사용자 ID와 식별자를 전달한다', async () => {
    const input: ManualHoldingIdentifierInput = {
      market: 'US',
      symbol: 'VOO',
    };
    service.deleteManualHolding.mockResolvedValue(true);

    await expect(resolver.deleteManualHolding(mockUser, input)).resolves.toBe(
      true,
    );
    expect(service.deleteManualHolding).toHaveBeenCalledWith(
      mockUser.userId,
      input,
    );
  });

  it('syncManualHoldingPrice는 사용자 ID와 식별자를 전달한다', async () => {
    const input: ManualHoldingIdentifierInput = {
      market: 'US',
      symbol: 'VOO',
    };
    const manualHolding = createHolding({ currentPrice: 420 });
    service.syncManualHoldingPrice.mockResolvedValue(manualHolding);

    await expect(
      resolver.syncManualHoldingPrice(mockUser, input),
    ).resolves.toBe(manualHolding);
    expect(service.syncManualHoldingPrice).toHaveBeenCalledWith(
      mockUser.userId,
      input,
    );
  });
});
