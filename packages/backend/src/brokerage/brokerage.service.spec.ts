import { NotFoundException } from '@nestjs/common';
import { BrokerageService } from './brokerage.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateBrokerageAccountInput,
  UpdateBrokerageAccountInput,
} from './brokerage.dto';
import { CredentialCryptoService } from './credential-crypto.service';

const USER_ID = 'user-1';

type MockedPrisma = {
  broker: {
    findMany: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    deleteMany: jest.Mock;
  };
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
  let credentialCryptoMock: jest.Mocked<
    Pick<CredentialCryptoService, 'encrypt'>
  >;

  beforeEach(() => {
    prismaMock = {
      broker: {
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        deleteMany: jest.fn(),
      },
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

    credentialCryptoMock = {
      encrypt: jest.fn((value) => ({
        cipher: `${value}-cipher`,
        iv: `${value}-iv`,
        authTag: `${value}-tag`,
      })),
    };

    service = new BrokerageService(
      prismaMock as unknown as PrismaService,
      credentialCryptoMock as unknown as CredentialCryptoService,
    );
  });

  it('createAccount는 사용자와 연결된 계좌를 생성한다', async () => {
    const input: CreateBrokerageAccountInput = {
      name: '미래에셋 계좌',
      brokerId: 'broker-1',
      apiKey: 'api-key',
    };
    prismaMock.brokerageAccount.create.mockResolvedValue({ id: 'acc-1' });

    await service.createAccount(USER_ID, input);

    expect(credentialCryptoMock.encrypt).toHaveBeenCalledWith('api-key');
    expect(prismaMock.brokerageAccount.create).toHaveBeenCalledWith({
      data: {
        name: input.name,
        broker: { connect: { id: input.brokerId } },
        apiKeyCipher: 'api-key-cipher',
        apiKeyIv: 'api-key-iv',
        apiKeyTag: 'api-key-tag',
        apiSecretCipher: null,
        apiSecretIv: null,
        apiSecretTag: null,
        description: null,
        isActive: true,
        user: { connect: { id: USER_ID } },
      },
      include: { broker: true },
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
      include: { broker: true },
    });
  });

  it('updateAccount는 자격 증명 갱신 시 암호화한다', async () => {
    prismaMock.brokerageAccount.findFirst.mockResolvedValue({ id: 'acc-1' });
    const input: UpdateBrokerageAccountInput = {
      id: 'acc-1',
      apiKey: 'new-key',
      apiSecret: 'new-secret',
    };
    prismaMock.brokerageAccount.update.mockResolvedValue({ id: 'acc-1' });

    await service.updateAccount(USER_ID, input);

    expect(credentialCryptoMock.encrypt).toHaveBeenCalledWith('new-key');
    expect(credentialCryptoMock.encrypt).toHaveBeenCalledWith('new-secret');
    expect(prismaMock.brokerageAccount.update).toHaveBeenCalledWith({
      where: { id: input.id },
      data: {
        apiKeyCipher: 'new-key-cipher',
        apiKeyIv: 'new-key-iv',
        apiKeyTag: 'new-key-tag',
        apiSecretCipher: 'new-secret-cipher',
        apiSecretIv: 'new-secret-iv',
        apiSecretTag: 'new-secret-tag',
      },
      include: { broker: true },
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
      include: { broker: true },
    });
  });

  it('getAccount는 사용자 필터를 포함한다', async () => {
    prismaMock.brokerageAccount.findFirst.mockResolvedValue({ id: 'acc-1' });

    await service.getAccount(USER_ID, 'acc-1');
    expect(prismaMock.brokerageAccount.findFirst).toHaveBeenCalledWith({
      where: { id: 'acc-1', userId: USER_ID },
      include: { broker: true },
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

  it('listBrokers는 이름 순으로 정렬해 조회한다', async () => {
    prismaMock.broker.findMany.mockResolvedValue([]);

    await service.listBrokers();
    expect(prismaMock.broker.findMany).toHaveBeenCalledWith({
      orderBy: { name: 'asc' },
    });
  });

  it('createBroker는 입력을 그대로 위임한다', async () => {
    const input = {
      code: 'KR-BROKER',
      name: '한국증권',
      description: 'desc',
      apiBaseUrl: 'https://api.example.com',
    };
    prismaMock.broker.create.mockResolvedValue({ id: 'broker-1' });

    await service.createBroker(input);
    expect(prismaMock.broker.create).toHaveBeenCalledWith({
      data: {
        code: input.code,
        name: input.name,
        description: input.description,
        apiBaseUrl: input.apiBaseUrl,
      },
    });
  });

  it('updateBroker는 전달된 필드만 수정한다', async () => {
    prismaMock.broker.update.mockResolvedValue({ id: 'broker-1' });

    await service.updateBroker({ id: 'broker-1', name: '새 이름' });

    expect(prismaMock.broker.update).toHaveBeenCalledWith({
      where: { id: 'broker-1' },
      data: { name: '새 이름' },
    });
  });

  it('deleteBroker는 삭제 여부를 boolean으로 반환한다', async () => {
    prismaMock.broker.deleteMany.mockResolvedValue({ count: 1 });

    await expect(service.deleteBroker('broker-1')).resolves.toBe(true);
  });
});
