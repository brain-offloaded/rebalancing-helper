import { NotFoundException } from '@nestjs/common';
import {
  HoldingSource as PrismaHoldingSource,
  HoldingAccountSyncMode as PrismaHoldingAccountSyncMode,
  Prisma,
} from '@prisma/client';
import { HoldingsService } from './holdings.service';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaDecimalService } from '../prisma/prisma-decimal.service';
import { HoldingTag, Holding, HoldingSource } from './holdings.entities';
import { MarketDataService, MarketQuote } from './market-data.service';
import {
  AddHoldingTagInput,
  RemoveHoldingTagInput,
  SetHoldingTagsInput,
  CreateManualHoldingInput,
  IncreaseManualHoldingInput,
  SetManualHoldingQuantityInput,
  ManualHoldingIdentifierInput,
  SetHoldingAliasInput,
} from './holdings.dto';

const USER_ID = 'user-1';
const ACCOUNT_ID = 'account-1';

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
  holdingAccount: {
    findFirst: jest.Mock;
  };
  holding: {
    findMany: jest.Mock;
    findFirst: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  $transaction: jest.Mock;
};

describe('HoldingsService', () => {
  let prismaMock: MockedPrisma;
  let service: HoldingsService;
  let marketDataServiceMock: jest.Mocked<MarketDataService>;
  let prismaDecimalService: PrismaDecimalService;

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
      holdingAccount: {
        findFirst: jest.fn().mockResolvedValue({
          id: ACCOUNT_ID,
          userId: USER_ID,
          syncMode: PrismaHoldingAccountSyncMode.MANUAL,
        }),
      },
      holding: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    marketDataServiceMock = {
      getQuote: jest.fn(),
    } as unknown as jest.Mocked<MarketDataService>;

    prismaDecimalService = new PrismaDecimalService();
    service = new HoldingsService(
      prismaMock as unknown as PrismaService,
      prismaDecimalService,
      marketDataServiceMock,
    );
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

  it('getHoldings는 사용자와 옵션에 맞게 조회한다', async () => {
    prismaMock.holding.findMany.mockResolvedValue([]);

    await service.getHoldings(USER_ID, {
      source: PrismaHoldingSource.BROKERAGE,
      accountId: 'acc-1',
    });

    expect(prismaMock.holdingAccount.findFirst).toHaveBeenCalledWith({
      where: { id: 'acc-1', userId: USER_ID },
    });
    expect(prismaMock.holding.findMany).toHaveBeenCalledWith({
      where: {
        userId: USER_ID,
        source: PrismaHoldingSource.BROKERAGE,
        accountId: 'acc-1',
      },
      orderBy: [{ symbol: 'asc' }, { market: 'asc' }],
    });
  });

  it('소유하지 않은 태그에 접근하면 NotFoundException을 던진다', async () => {
    prismaMock.tag.findFirst.mockResolvedValueOnce(null);

    await expect(service.getHoldingsForTag(USER_ID, 'tag-x')).rejects.toThrow(
      'Tag not found',
    );
  });

  describe('수동 보유 종목', () => {
    const quote: MarketQuote = {
      symbol: 'VOO',
      displaySymbol: 'VOO',
      name: 'Vanguard S&P 500 ETF',
      price: 412.35,
      currency: 'USD',
      market: 'US',
      exchange: 'NYSEArca',
      lastUpdated: new Date('2024-01-01T00:00:00Z'),
    };

    const manualHolding: Holding = {
      id: 'manual-1',
      source: HoldingSource.MANUAL,
      accountId: ACCOUNT_ID,
      market: 'US',
      symbol: 'VOO',
      name: 'Vanguard S&P 500 ETF',
      alias: null,
      quantity: 2,
      currentPrice: 412.35,
      marketValue: 824.7,
      currency: 'USD',
      lastUpdated: new Date('2024-01-02T00:00:00Z'),
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-02T00:00:00Z'),
    };

    const identifier: ManualHoldingIdentifierInput = {
      accountId: ACCOUNT_ID,
      market: 'US',
      symbol: 'VOO',
    };

    beforeEach(() => {
      prismaMock.holdingAccount.findFirst.mockClear();
      prismaMock.holding.findFirst.mockReset();
      prismaMock.holding.create.mockReset();
      prismaMock.holding.update.mockReset();
      prismaMock.holding.delete.mockReset();
      prismaMock.holding.findMany.mockReset();
      marketDataServiceMock.getQuote.mockReset();
    });

    it('createManualHolding는 시장 종목을 검증한 뒤 생성한다', async () => {
      const input: CreateManualHoldingInput = {
        accountId: ACCOUNT_ID,
        market: 'US',
        symbol: 'VOO',
        quantity: 2,
      };
      marketDataServiceMock.getQuote.mockResolvedValue(quote);
      prismaMock.holding.create.mockResolvedValue({
        ...manualHolding,
        quantity: input.quantity,
        marketValue: Number(input.quantity) * Number(quote.price),
      });

      const result = await service.createManualHolding(USER_ID, input);

      expect(marketDataServiceMock.getQuote).toHaveBeenCalledWith(
        input.market,
        input.symbol,
      );
      expect(prismaMock.holdingAccount.findFirst).toHaveBeenCalledWith({
        where: { id: ACCOUNT_ID, userId: USER_ID },
      });
      expect(prismaMock.holding.create).toHaveBeenCalledWith({
        data: {
          userId: USER_ID,
          source: PrismaHoldingSource.MANUAL,
          accountId: ACCOUNT_ID,
          market: input.market,
          symbol: input.symbol,
          name: quote.name,
          quantity: input.quantity,
          currentPrice: quote.price,
          marketValue: Number(input.quantity) * Number(quote.price),
          currency: quote.currency,
          lastUpdated: quote.lastUpdated,
        },
      });
      expect(result.marketValue).toBeCloseTo(
        Number(input.quantity) * Number(quote.price),
      );
    });

    it('createManualHolding는 수량이 0이어도 생성한다', async () => {
      const input: CreateManualHoldingInput = {
        accountId: ACCOUNT_ID,
        market: 'US',
        symbol: 'VOO',
        quantity: 0,
      };
      marketDataServiceMock.getQuote.mockResolvedValue(quote);
      prismaMock.holding.create.mockResolvedValue({
        ...manualHolding,
        quantity: input.quantity,
        marketValue: 0,
      });

      const result = await service.createManualHolding(USER_ID, input);

      expect(marketDataServiceMock.getQuote).toHaveBeenCalledWith(
        input.market,
        input.symbol,
      );
      expect(prismaMock.holding.create).toHaveBeenCalledWith({
        data: {
          userId: USER_ID,
          source: PrismaHoldingSource.MANUAL,
          accountId: ACCOUNT_ID,
          market: input.market,
          symbol: input.symbol,
          name: quote.name,
          quantity: input.quantity,
          currentPrice: quote.price,
          marketValue: 0,
          currency: quote.currency,
          lastUpdated: quote.lastUpdated,
        },
      });
      expect(result.marketValue).toBe(0);
      expect(result.quantity).toBe(0);
    });

    it('createManualHolding는 존재하지 않는 종목이면 예외를 던진다', async () => {
      const input: CreateManualHoldingInput = {
        accountId: ACCOUNT_ID,
        market: 'US',
        symbol: 'VOO',
        quantity: 1,
      };
      marketDataServiceMock.getQuote.mockRejectedValue(new NotFoundException());

      await expect(service.createManualHolding(USER_ID, input)).rejects.toThrow(
        NotFoundException,
      );
      expect(prismaMock.holding.create).not.toHaveBeenCalled();
    });

    it('increaseManualHolding는 보유 수량을 증가시키고 시장가치를 재계산한다', async () => {
      const input: IncreaseManualHoldingInput = {
        accountId: ACCOUNT_ID,
        market: 'US',
        symbol: 'VOO',
        quantityDelta: 3,
      };
      prismaMock.holding.findFirst.mockResolvedValue({
        id: manualHolding.id,
        userId: USER_ID,
        source: PrismaHoldingSource.MANUAL,
        accountId: ACCOUNT_ID,
        market: manualHolding.market,
        symbol: manualHolding.symbol,
        alias: manualHolding.alias,
        quantity: 2,
        currentPrice: manualHolding.currentPrice,
        marketValue: Number(manualHolding.currentPrice) * 2,
        currency: manualHolding.currency,
        name: manualHolding.name,
        lastUpdated: manualHolding.lastUpdated,
        createdAt: manualHolding.createdAt,
        updatedAt: manualHolding.updatedAt,
      });
      prismaMock.holding.update.mockResolvedValue({
        ...manualHolding,
        quantity: 5,
        marketValue: Number(manualHolding.currentPrice) * 5,
      });

      const result = await service.increaseManualHolding(USER_ID, input);

      expect(prismaMock.holdingAccount.findFirst).toHaveBeenCalledWith({
        where: { id: ACCOUNT_ID, userId: USER_ID },
      });
      expect(prismaMock.holding.findFirst).toHaveBeenCalledWith({
        where: {
          userId: USER_ID,
          accountId: ACCOUNT_ID,
          market: input.market,
          symbol: input.symbol,
          source: PrismaHoldingSource.MANUAL,
        },
      });
      expect(prismaMock.holding.update).toHaveBeenCalledWith({
        where: { id: manualHolding.id },
        data: {
          quantity: 5,
          marketValue: Number(manualHolding.currentPrice) * 5,
        },
      });
      expect(result.quantity).toBe(5);
    });

    it('increaseManualHolding는 보유 내역이 없으면 예외를 던진다', async () => {
      const input: IncreaseManualHoldingInput = {
        accountId: ACCOUNT_ID,
        market: 'US',
        symbol: 'VOO',
        quantityDelta: 1,
      };
      prismaMock.holding.findFirst.mockResolvedValue(null);

      await expect(
        service.increaseManualHolding(USER_ID, input),
      ).rejects.toThrow('Holding not found');
      expect(prismaMock.holdingAccount.findFirst).toHaveBeenCalledWith({
        where: { id: ACCOUNT_ID, userId: USER_ID },
      });
      expect(prismaMock.holding.update).not.toHaveBeenCalled();
    });

    it('setManualHoldingQuantity는 수량을 설정하고 시장가치를 재계산한다', async () => {
      const input: SetManualHoldingQuantityInput = {
        accountId: ACCOUNT_ID,
        market: 'US',
        symbol: 'VOO',
        quantity: 7,
      };
      prismaMock.holding.findFirst.mockResolvedValue({
        id: manualHolding.id,
        userId: USER_ID,
        source: PrismaHoldingSource.MANUAL,
        accountId: ACCOUNT_ID,
        market: manualHolding.market,
        symbol: manualHolding.symbol,
        alias: manualHolding.alias,
        quantity: 2,
        currentPrice: manualHolding.currentPrice,
        marketValue: Number(manualHolding.currentPrice) * 2,
        currency: manualHolding.currency,
        name: manualHolding.name,
        lastUpdated: manualHolding.lastUpdated,
        createdAt: manualHolding.createdAt,
        updatedAt: manualHolding.updatedAt,
      });
      prismaMock.holding.update.mockResolvedValue({
        ...manualHolding,
        quantity: input.quantity,
        marketValue:
          Number(manualHolding.currentPrice) * Number(input.quantity),
      });

      const result = await service.setManualHoldingQuantity(USER_ID, input);

      expect(prismaMock.holdingAccount.findFirst).toHaveBeenCalledWith({
        where: { id: ACCOUNT_ID, userId: USER_ID },
      });
      expect(prismaMock.holding.update).toHaveBeenCalledTimes(1);
      const updateArgs = prismaMock.holding.update.mock.calls[0][0];
      expect(updateArgs.where).toEqual({ id: manualHolding.id });
      expect(updateArgs.data.quantity).toBe(input.quantity);
      expect(updateArgs.data.marketValue).toBeCloseTo(
        Number(manualHolding.currentPrice) * Number(input.quantity),
      );
      expect(result.quantity).toBe(input.quantity);
    });

    it('setManualHoldingQuantity는 보유 내역이 없으면 예외를 던진다', async () => {
      const input: SetManualHoldingQuantityInput = {
        accountId: ACCOUNT_ID,
        market: 'US',
        symbol: 'VOO',
        quantity: 3,
      };
      prismaMock.holding.findFirst.mockResolvedValue(null);

      await expect(
        service.setManualHoldingQuantity(USER_ID, input),
      ).rejects.toThrow('Holding not found');
      expect(prismaMock.holdingAccount.findFirst).toHaveBeenCalledWith({
        where: { id: ACCOUNT_ID, userId: USER_ID },
      });
      expect(prismaMock.holding.update).not.toHaveBeenCalled();
    });

    it('deleteManualHolding는 삭제 성공 여부를 반환한다', async () => {
      prismaMock.holding.findFirst.mockResolvedValue({
        id: manualHolding.id,
        userId: USER_ID,
        source: PrismaHoldingSource.MANUAL,
        accountId: ACCOUNT_ID,
        market: manualHolding.market,
        symbol: manualHolding.symbol,
        alias: manualHolding.alias,
        quantity: manualHolding.quantity,
        currentPrice: manualHolding.currentPrice,
        marketValue: manualHolding.marketValue,
        currency: manualHolding.currency,
        name: manualHolding.name,
        lastUpdated: manualHolding.lastUpdated,
        createdAt: manualHolding.createdAt,
        updatedAt: manualHolding.updatedAt,
      });
      prismaMock.holding.delete.mockResolvedValue({
        id: manualHolding.id,
      });

      await expect(
        service.deleteManualHolding(USER_ID, identifier),
      ).resolves.toBe(true);
      expect(prismaMock.holdingAccount.findFirst).toHaveBeenCalledWith({
        where: { id: ACCOUNT_ID, userId: USER_ID },
      });
      expect(prismaMock.holding.findFirst).toHaveBeenCalledWith({
        where: {
          userId: USER_ID,
          accountId: ACCOUNT_ID,
          market: identifier.market,
          symbol: identifier.symbol,
          source: PrismaHoldingSource.MANUAL,
        },
      });
      expect(prismaMock.holding.delete).toHaveBeenCalledWith({
        where: { id: manualHolding.id },
      });
    });

    it('deleteManualHolding는 존재하지 않으면 false를 반환한다', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'not found',
        {
          code: 'P2025',
          clientVersion: 'test',
        },
      );
      prismaMock.holding.findFirst.mockResolvedValue({
        id: manualHolding.id,
        userId: USER_ID,
        source: PrismaHoldingSource.MANUAL,
        accountId: ACCOUNT_ID,
        market: manualHolding.market,
        symbol: manualHolding.symbol,
        alias: manualHolding.alias,
        quantity: manualHolding.quantity,
        currentPrice: manualHolding.currentPrice,
        marketValue: manualHolding.marketValue,
        currency: manualHolding.currency,
        name: manualHolding.name,
        lastUpdated: manualHolding.lastUpdated,
        createdAt: manualHolding.createdAt,
        updatedAt: manualHolding.updatedAt,
      });
      prismaMock.holding.delete.mockRejectedValue(prismaError);

      await expect(
        service.deleteManualHolding(USER_ID, identifier),
      ).resolves.toBe(false);
      expect(prismaMock.holdingAccount.findFirst).toHaveBeenCalledWith({
        where: { id: ACCOUNT_ID, userId: USER_ID },
      });
    });

    it('syncManualHoldingPrice는 현재가를 갱신하고 시장가치를 재계산한다', async () => {
      prismaMock.holding.findFirst.mockResolvedValue({
        id: manualHolding.id,
        userId: USER_ID,
        source: PrismaHoldingSource.MANUAL,
        accountId: ACCOUNT_ID,
        market: manualHolding.market,
        symbol: manualHolding.symbol,
        alias: manualHolding.alias,
        quantity: manualHolding.quantity,
        currentPrice: 300,
        marketValue: 300 * Number(manualHolding.quantity),
        currency: manualHolding.currency,
        name: manualHolding.name,
        lastUpdated: manualHolding.lastUpdated,
        createdAt: manualHolding.createdAt,
        updatedAt: manualHolding.updatedAt,
      });
      marketDataServiceMock.getQuote.mockResolvedValue({
        ...quote,
        price: 500,
        lastUpdated: new Date('2024-01-03T00:00:00Z'),
      });
      prismaMock.holding.update.mockResolvedValue({
        ...manualHolding,
        currentPrice: 500,
        marketValue: Number(manualHolding.quantity) * 500,
        lastUpdated: new Date('2024-01-03T00:00:00Z'),
      });

      const result = await service.syncManualHoldingPrice(USER_ID, identifier);

      expect(marketDataServiceMock.getQuote).toHaveBeenCalledWith(
        identifier.market,
        identifier.symbol,
      );
      expect(prismaMock.holdingAccount.findFirst).toHaveBeenCalledWith({
        where: { id: ACCOUNT_ID, userId: USER_ID },
      });
      expect(prismaMock.holding.findFirst).toHaveBeenCalledWith({
        where: {
          userId: USER_ID,
          accountId: ACCOUNT_ID,
          market: identifier.market,
          symbol: identifier.symbol,
          source: PrismaHoldingSource.MANUAL,
        },
      });
      expect(prismaMock.holding.update).toHaveBeenCalledWith({
        where: { id: manualHolding.id },
        data: {
          currentPrice: 500,
          marketValue: Number(manualHolding.quantity) * 500,
          name: quote.name,
          currency: quote.currency,
          lastUpdated: new Date('2024-01-03T00:00:00Z'),
        },
      });
      expect(result.currentPrice).toBe(500);
    });

    it('syncManualHoldingPrice는 보유 내역이 없으면 예외를 던진다', async () => {
      prismaMock.holding.findFirst.mockResolvedValue(null);

      await expect(
        service.syncManualHoldingPrice(USER_ID, identifier),
      ).rejects.toThrow('Holding not found');
      expect(prismaMock.holdingAccount.findFirst).toHaveBeenCalledWith({
        where: { id: ACCOUNT_ID, userId: USER_ID },
      });
      expect(marketDataServiceMock.getQuote).not.toHaveBeenCalled();
    });

    it('syncManualHoldingPrice는 시장 데이터가 없으면 예외를 던진다', async () => {
      prismaMock.holding.findFirst.mockResolvedValue({
        id: manualHolding.id,
        userId: USER_ID,
        source: PrismaHoldingSource.MANUAL,
        accountId: ACCOUNT_ID,
        market: manualHolding.market,
        symbol: manualHolding.symbol,
        alias: manualHolding.alias,
        quantity: manualHolding.quantity,
        currentPrice: manualHolding.currentPrice,
        marketValue: manualHolding.marketValue,
        currency: manualHolding.currency,
        name: manualHolding.name,
        lastUpdated: manualHolding.lastUpdated,
        createdAt: manualHolding.createdAt,
        updatedAt: manualHolding.updatedAt,
      });
      marketDataServiceMock.getQuote.mockRejectedValue(new NotFoundException());

      await expect(
        service.syncManualHoldingPrice(USER_ID, identifier),
      ).rejects.toThrow(NotFoundException);
      expect(prismaMock.holdingAccount.findFirst).toHaveBeenCalledWith({
        where: { id: ACCOUNT_ID, userId: USER_ID },
      });
      expect(prismaMock.holding.update).not.toHaveBeenCalled();
    });

    it('setHoldingAlias는 별칭을 저장하고 공백을 제거한다', async () => {
      const input: SetHoldingAliasInput = {
        holdingId: manualHolding.id,
        alias: '  나의 ETF  ',
      };
      prismaMock.holding.findFirst.mockResolvedValue({
        ...manualHolding,
        userId: USER_ID,
        source: PrismaHoldingSource.MANUAL,
      });
      prismaMock.holding.update.mockResolvedValue({
        ...manualHolding,
        alias: '나의 ETF',
      });

      const result = await service.setHoldingAlias(USER_ID, input);

      expect(prismaMock.holding.findFirst).toHaveBeenCalledWith({
        where: { id: manualHolding.id, userId: USER_ID },
      });
      expect(prismaMock.holding.update).toHaveBeenCalledWith({
        where: { id: manualHolding.id },
        data: { alias: '나의 ETF' },
      });
      expect(result.alias).toBe('나의 ETF');
    });

    it('setHoldingAlias는 빈 문자열이면 별칭을 제거한다', async () => {
      const input: SetHoldingAliasInput = {
        holdingId: manualHolding.id,
        alias: '',
      };
      prismaMock.holding.findFirst.mockResolvedValue({
        ...manualHolding,
        userId: USER_ID,
        source: PrismaHoldingSource.MANUAL,
      });
      prismaMock.holding.update.mockResolvedValue({
        ...manualHolding,
        alias: null,
      });

      const result = await service.setHoldingAlias(USER_ID, input);

      expect(prismaMock.holding.update).toHaveBeenCalledWith({
        where: { id: manualHolding.id },
        data: { alias: null },
      });
      expect(result.alias).toBeNull();
    });

    it('getManualHoldings는 사용자 기준으로 정렬된 내역을 반환한다', async () => {
      prismaMock.holding.findMany.mockResolvedValue([manualHolding]);

      const result = await service.getManualHoldings(USER_ID);

      expect(prismaMock.holding.findMany).toHaveBeenCalledWith({
        where: { userId: USER_ID, source: PrismaHoldingSource.MANUAL },
        orderBy: [{ market: 'asc' }, { symbol: 'asc' }],
      });
      expect(result).toEqual([manualHolding]);
    });
  });
});
