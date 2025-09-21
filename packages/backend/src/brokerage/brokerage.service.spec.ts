import { BrokerageService } from './brokerage.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateBrokerageAccountInput,
  UpdateBrokerageAccountInput,
} from './brokerage.dto';
import { NotFoundException } from '@nestjs/common';

const USER_ID = 'user-1';

type MockedPrisma = {
  brokerageAccount: {
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    findMany: jest.Mock;
    findFirst: jest.Mock;
    findUnique: jest.Mock;
  };
  brokerageHolding: {
    findMany: jest.Mock;
    deleteMany: jest.Mock;
    createMany: jest.Mock;
  };
  $transaction: jest.Mock;
};

describe('BrokerageService', () => {
  let prismaMock: MockedPrisma;
  let service: BrokerageService;

  beforeEach(() => {
    prismaMock = {
      brokerageAccount: {
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
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

  it('createAccount는 사용자와 연결된 계좌를 생성한다', async () => {
    const input: CreateBrokerageAccountInput = {
      name: '미래에셋 계좌',
      brokerName: '미래에셋',
      apiKey: 'api-key',
    };
    prismaMock.brokerageAccount.create.mockResolvedValue({ id: 'acc-1' });

    await service.createAccount(USER_ID, input);

    expect(prismaMock.brokerageAccount.create).toHaveBeenCalledWith({
      data: {
        name: input.name,
        brokerName: input.brokerName,
        apiKey: input.apiKey,
        description: null,
        apiSecret: null,
        apiBaseUrl: null,
        user: { connect: { id: USER_ID } },
      },
    });
  });

  it('updateAccount는 소유권을 검증하고 업데이트한다', async () => {
    prismaMock.brokerageAccount.findFirst.mockResolvedValue({ id: 'acc-1' });
    const input: UpdateBrokerageAccountInput = {
      id: 'acc-1',
      name: '새 이름',
    };
    prismaMock.brokerageAccount.update.mockResolvedValue({ id: 'acc-1' });

    await service.updateAccount(USER_ID, input);

    expect(prismaMock.brokerageAccount.findFirst).toHaveBeenCalledWith({
      where: { id: input.id, userId: USER_ID },
      select: { id: true },
    });
    expect(prismaMock.brokerageAccount.update).toHaveBeenCalledWith({
      where: { id: input.id },
      data: { name: input.name },
    });
  });

  it('updateAccount는 타인의 계좌면 NotFoundException을 던진다', async () => {
    prismaMock.brokerageAccount.findFirst.mockResolvedValue(null);

    await expect(
      service.updateAccount(USER_ID, { id: 'acc-x', name: 'foo' }),
    ).rejects.toThrow(NotFoundException);
    expect(prismaMock.brokerageAccount.update).not.toHaveBeenCalled();
  });

  it('deleteAccount는 소유권을 확인한 뒤 삭제한다', async () => {
    prismaMock.brokerageAccount.findFirst.mockResolvedValue({ id: 'acc-1' });
    prismaMock.brokerageAccount.delete.mockResolvedValue({});

    await expect(service.deleteAccount(USER_ID, 'acc-1')).resolves.toBe(true);
    expect(prismaMock.brokerageAccount.delete).toHaveBeenCalledWith({
      where: { id: 'acc-1' },
    });
  });

  it('deleteAccount는 타인의 계좌면 false를 반환한다', async () => {
    prismaMock.brokerageAccount.findFirst.mockResolvedValue(null);

    await expect(service.deleteAccount(USER_ID, 'acc-1')).resolves.toBe(false);
    expect(prismaMock.brokerageAccount.delete).not.toHaveBeenCalled();
  });

  it('getAccounts는 사용자에 연결된 계좌를 조회한다', async () => {
    prismaMock.brokerageAccount.findMany.mockResolvedValue([]);

    await service.getAccounts(USER_ID);
    expect(prismaMock.brokerageAccount.findMany).toHaveBeenCalledWith({
      where: { userId: USER_ID },
      orderBy: { createdAt: 'asc' },
    });
  });

  it('getAccount는 사용자 필터를 포함한다', async () => {
    prismaMock.brokerageAccount.findFirst.mockResolvedValue({ id: 'acc-1' });

    await service.getAccount(USER_ID, 'acc-1');
    expect(prismaMock.brokerageAccount.findFirst).toHaveBeenCalledWith({
      where: { id: 'acc-1', userId: USER_ID },
    });
  });

  it('getHoldings는 사용자 ID를 조건에 포함한다', async () => {
    prismaMock.brokerageHolding.findMany.mockResolvedValue([]);

    await service.getHoldings(USER_ID);
    expect(prismaMock.brokerageHolding.findMany).toHaveBeenCalledWith({
      where: {
        account: { userId: USER_ID },
      },
      orderBy: { symbol: 'asc' },
    });

    prismaMock.brokerageHolding.findMany.mockClear();
    await service.getHoldings(USER_ID, 'acc-1');
    expect(prismaMock.brokerageHolding.findMany).toHaveBeenCalledWith({
      where: {
        account: { userId: USER_ID },
        accountId: 'acc-1',
      },
      orderBy: { symbol: 'asc' },
    });
  });

  it('refreshHoldings는 사용자 계좌가 아니면 예외를 던진다', async () => {
    prismaMock.brokerageAccount.findUnique.mockResolvedValue({
      id: 'acc-1',
      userId: 'other-user',
    });

    await expect(service.refreshHoldings(USER_ID, 'acc-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('refreshHoldings는 성공 시 갱신된 보유 정보를 반환한다', async () => {
    prismaMock.brokerageAccount.findUnique.mockResolvedValue({
      id: 'acc-1',
      userId: USER_ID,
    });
    prismaMock.$transaction.mockResolvedValue(undefined);
    prismaMock.brokerageHolding.findMany.mockResolvedValue([]);

    await service.refreshHoldings(USER_ID, 'acc-1');

    expect(prismaMock.brokerageHolding.deleteMany).toHaveBeenCalledWith({
      where: { accountId: 'acc-1' },
    });
    expect(prismaMock.brokerageHolding.createMany).toHaveBeenCalledTimes(1);
    expect(prismaMock.brokerageHolding.findMany).toHaveBeenCalledWith({
      where: { accountId: 'acc-1', account: { userId: USER_ID } },
      orderBy: { symbol: 'asc' },
    });
  });
});
