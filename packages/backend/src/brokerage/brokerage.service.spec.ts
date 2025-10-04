import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  HoldingSource as PrismaHoldingSource,
  HoldingAccountProviderType as PrismaHoldingAccountProviderType,
  HoldingAccountSyncMode as PrismaHoldingAccountSyncMode,
} from '@prisma/client';
import { BrokerageService } from './brokerage.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateBrokerageAccountInput,
  UpdateBrokerageAccountInput,
} from './brokerage.dto';
import { CredentialCryptoService } from './credential-crypto.service';
import { BrokerageAccountSyncMode } from './brokerage.entities';

const USER_ID = 'user-1';

type MockedPrisma = {
  broker: {
    findMany: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    deleteMany: jest.Mock;
  };
  holdingAccount: {
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    findMany: jest.Mock;
    findFirst: jest.Mock;
  };
  holding: {
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
      holdingAccount: {
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
      holding: {
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
      syncMode: BrokerageAccountSyncMode.API,
      apiKey: 'api-key',
    };
    const now = new Date();
    prismaMock.holdingAccount.create.mockResolvedValue({
      id: 'acc-1',
      name: input.name,
      brokerId: input.brokerId,
      providerType: PrismaHoldingAccountProviderType.BROKERAGE,
      syncMode: PrismaHoldingAccountSyncMode.API,
      description: null,
      isActive: true,
      apiKeyCipher: 'api-key-cipher',
      apiKeyIv: 'api-key-iv',
      apiKeyTag: 'api-key-tag',
      apiSecretCipher: null,
      apiSecretIv: null,
      apiSecretTag: null,
      userId: USER_ID,
      broker: {
        id: input.brokerId,
        code: 'CODE',
        name: '브로커',
        description: null,
        apiBaseUrl: null,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      createdAt: now,
      updatedAt: now,
    });

    await service.createAccount(USER_ID, input);

    expect(credentialCryptoMock.encrypt).toHaveBeenCalledWith('api-key');
    expect(prismaMock.holdingAccount.create).toHaveBeenCalledWith({
      data: {
        name: input.name,
        broker: { connect: { id: input.brokerId } },
        providerType: PrismaHoldingAccountProviderType.BROKERAGE,
        syncMode: PrismaHoldingAccountSyncMode.API,
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

  it('createAccount는 API 모드에 API 키가 없으면 예외를 던진다', async () => {
    const input: CreateBrokerageAccountInput = {
      name: '미래에셋 계좌',
      brokerId: 'broker-1',
      syncMode: BrokerageAccountSyncMode.API,
    };

    await expect(service.createAccount(USER_ID, input)).rejects.toThrow(
      BadRequestException,
    );
    expect(prismaMock.holdingAccount.create).not.toHaveBeenCalled();
  });

  it('updateAccount는 소유권을 검증하고 업데이트한다', async () => {
    prismaMock.holdingAccount.findFirst.mockResolvedValue({
      id: 'acc-1',
      syncMode: PrismaHoldingAccountSyncMode.API,
      apiKeyCipher: 'cipher',
    });
    const input: UpdateBrokerageAccountInput = {
      id: 'acc-1',
      name: '새 이름',
    };
    const now = new Date();
    prismaMock.holdingAccount.update.mockResolvedValue({
      id: 'acc-1',
      name: input.name!,
      brokerId: 'broker-1',
      providerType: PrismaHoldingAccountProviderType.BROKERAGE,
      syncMode: PrismaHoldingAccountSyncMode.API,
      description: null,
      isActive: true,
      apiKeyCipher: 'cipher',
      apiKeyIv: 'iv',
      apiKeyTag: 'tag',
      apiSecretCipher: null,
      apiSecretIv: null,
      apiSecretTag: null,
      userId: USER_ID,
      broker: {
        id: 'broker-1',
        code: 'CODE',
        name: '브로커',
        description: null,
        apiBaseUrl: null,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      createdAt: now,
      updatedAt: now,
    });

    await service.updateAccount(USER_ID, input);

    expect(prismaMock.holdingAccount.findFirst).toHaveBeenCalledWith({
      where: {
        id: input.id,
        userId: USER_ID,
        providerType: PrismaHoldingAccountProviderType.BROKERAGE,
      },
      select: { id: true, syncMode: true, apiKeyCipher: true },
    });
    expect(prismaMock.holdingAccount.update).toHaveBeenCalledWith({
      where: { id: input.id },
      data: { name: input.name },
      include: { broker: true },
    });
  });

  it('updateAccount는 자격 증명 갱신 시 암호화한다', async () => {
    prismaMock.holdingAccount.findFirst.mockResolvedValue({
      id: 'acc-1',
      syncMode: PrismaHoldingAccountSyncMode.API,
      apiKeyCipher: 'old-cipher',
    });
    const input: UpdateBrokerageAccountInput = {
      id: 'acc-1',
      apiKey: 'new-key',
      apiSecret: 'new-secret',
    };
    const now = new Date();
    prismaMock.holdingAccount.update.mockResolvedValue({
      id: 'acc-1',
      name: '계좌',
      brokerId: 'broker-1',
      providerType: PrismaHoldingAccountProviderType.BROKERAGE,
      syncMode: PrismaHoldingAccountSyncMode.API,
      description: null,
      isActive: true,
      apiKeyCipher: 'new-key-cipher',
      apiKeyIv: 'new-key-iv',
      apiKeyTag: 'new-key-tag',
      apiSecretCipher: 'new-secret-cipher',
      apiSecretIv: 'new-secret-iv',
      apiSecretTag: 'new-secret-tag',
      userId: USER_ID,
      broker: {
        id: 'broker-1',
        code: 'CODE',
        name: '브로커',
        description: null,
        apiBaseUrl: null,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      createdAt: now,
      updatedAt: now,
    });

    await service.updateAccount(USER_ID, input);

    expect(credentialCryptoMock.encrypt).toHaveBeenCalledWith('new-key');
    expect(credentialCryptoMock.encrypt).toHaveBeenCalledWith('new-secret');
    expect(prismaMock.holdingAccount.update).toHaveBeenCalledWith({
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

  it('updateAccount는 brokerId 변경과 비밀키 제거를 처리한다', async () => {
    prismaMock.holdingAccount.findFirst.mockResolvedValue({
      id: 'acc-1',
      syncMode: PrismaHoldingAccountSyncMode.MANUAL,
      apiKeyCipher: null,
    });
    const input: UpdateBrokerageAccountInput = {
      id: 'acc-1',
      brokerId: 'broker-2',
      isActive: false,
    };
    const now = new Date();
    prismaMock.holdingAccount.update.mockResolvedValue({
      id: 'acc-1',
      name: '계좌',
      brokerId: 'broker-2',
      providerType: PrismaHoldingAccountProviderType.BROKERAGE,
      syncMode: PrismaHoldingAccountSyncMode.MANUAL,
      description: null,
      isActive: false,
      apiKeyCipher: null,
      apiKeyIv: null,
      apiKeyTag: null,
      apiSecretCipher: null,
      apiSecretIv: null,
      apiSecretTag: null,
      userId: USER_ID,
      broker: {
        id: 'broker-2',
        code: 'CODE',
        name: '브로커',
        description: null,
        apiBaseUrl: null,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      createdAt: now,
      updatedAt: now,
    });

    await service.updateAccount(USER_ID, input);

    expect(credentialCryptoMock.encrypt).not.toHaveBeenCalled();
    expect(prismaMock.holdingAccount.update).toHaveBeenCalledWith({
      where: { id: input.id },
      data: {
        broker: { connect: { id: 'broker-2' } },
        isActive: false,
      },
      include: { broker: true },
    });
  });

  it('updateAccount는 타인의 계좌면 NotFoundException을 던진다', async () => {
    prismaMock.holdingAccount.findFirst.mockResolvedValue(null);

    await expect(
      service.updateAccount(USER_ID, { id: 'acc-x', name: 'foo' }),
    ).rejects.toThrow(NotFoundException);
    expect(prismaMock.holdingAccount.update).not.toHaveBeenCalled();
  });

  it('updateAccount는 API 모드 전환 시 API 키가 없으면 예외를 던진다', async () => {
    prismaMock.holdingAccount.findFirst.mockResolvedValue({
      id: 'acc-1',
      syncMode: PrismaHoldingAccountSyncMode.MANUAL,
      apiKeyCipher: null,
    });

    await expect(
      service.updateAccount(USER_ID, {
        id: 'acc-1',
        syncMode: BrokerageAccountSyncMode.API,
      }),
    ).rejects.toThrow(BadRequestException);
    expect(prismaMock.holdingAccount.update).not.toHaveBeenCalled();
  });

  it('deleteAccount는 소유권을 확인한 뒤 삭제한다', async () => {
    prismaMock.holdingAccount.findFirst.mockResolvedValue({ id: 'acc-1' });
    prismaMock.holdingAccount.delete.mockResolvedValue({});

    await expect(service.deleteAccount(USER_ID, 'acc-1')).resolves.toBe(true);
    expect(prismaMock.holdingAccount.delete).toHaveBeenCalledWith({
      where: { id: 'acc-1' },
    });
  });

  it('deleteAccount는 타인의 계좌면 false를 반환한다', async () => {
    prismaMock.holdingAccount.findFirst.mockResolvedValue(null);

    await expect(service.deleteAccount(USER_ID, 'acc-1')).resolves.toBe(false);
    expect(prismaMock.holdingAccount.delete).not.toHaveBeenCalled();
  });

  it('getAccounts는 사용자에 연결된 계좌를 조회한다', async () => {
    prismaMock.holdingAccount.findMany.mockResolvedValue([]);

    await service.getAccounts(USER_ID);
    expect(prismaMock.holdingAccount.findMany).toHaveBeenCalledWith({
      where: {
        userId: USER_ID,
        providerType: PrismaHoldingAccountProviderType.BROKERAGE,
      },
      orderBy: { createdAt: 'asc' },
      include: { broker: true },
    });
  });

  it('getAccount는 사용자 필터를 포함한다', async () => {
    prismaMock.holdingAccount.findFirst.mockResolvedValue(null);

    await service.getAccount(USER_ID, 'acc-1');
    expect(prismaMock.holdingAccount.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'acc-1',
        userId: USER_ID,
        providerType: PrismaHoldingAccountProviderType.BROKERAGE,
      },
      include: { broker: true },
    });
  });

  it('getHoldings는 사용자 ID를 조건에 포함한다', async () => {
    prismaMock.holding.findMany.mockResolvedValue([]);

    await service.getHoldings(USER_ID);
    expect(prismaMock.holding.findMany).toHaveBeenCalledWith({
      where: {
        userId: USER_ID,
        source: PrismaHoldingSource.BROKERAGE,
      },
      orderBy: { symbol: 'asc' },
    });

    prismaMock.holding.findMany.mockClear();
    prismaMock.holdingAccount.findFirst.mockResolvedValue({ id: 'acc-1' });
    await service.getHoldings(USER_ID, 'acc-1');
    expect(prismaMock.holding.findMany).toHaveBeenCalledWith({
      where: {
        userId: USER_ID,
        source: PrismaHoldingSource.BROKERAGE,
        accountId: 'acc-1',
      },
      orderBy: { symbol: 'asc' },
    });
  });

  it('refreshHoldings는 사용자 계좌가 아니면 예외를 던진다', async () => {
    prismaMock.holdingAccount.findFirst.mockResolvedValue(null);

    await expect(service.refreshHoldings(USER_ID, 'acc-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('refreshHoldings는 수동 동기화 계좌면 BadRequestException을 던진다', async () => {
    prismaMock.holdingAccount.findFirst.mockResolvedValue({
      id: 'acc-1',
      userId: USER_ID,
      providerType: PrismaHoldingAccountProviderType.BROKERAGE,
      syncMode: PrismaHoldingAccountSyncMode.MANUAL,
    });

    await expect(service.refreshHoldings(USER_ID, 'acc-1')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('refreshHoldings는 성공 시 갱신된 보유 정보를 반환한다', async () => {
    prismaMock.holdingAccount.findFirst.mockResolvedValue({
      id: 'acc-1',
      userId: USER_ID,
      providerType: PrismaHoldingAccountProviderType.BROKERAGE,
      syncMode: PrismaHoldingAccountSyncMode.API,
    });
    prismaMock.$transaction.mockResolvedValue(undefined);
    prismaMock.holding.findMany.mockResolvedValue([]);

    await service.refreshHoldings(USER_ID, 'acc-1');

    expect(prismaMock.holding.deleteMany).toHaveBeenCalledWith({
      where: { accountId: 'acc-1', source: PrismaHoldingSource.BROKERAGE },
    });
    expect(prismaMock.holding.createMany).toHaveBeenCalledTimes(1);
    expect(prismaMock.holding.findMany).toHaveBeenCalledWith({
      where: {
        userId: USER_ID,
        source: PrismaHoldingSource.BROKERAGE,
        accountId: 'acc-1',
      },
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

  it('updateBroker는 code/description/apiBaseUrl/isActive를 갱신한다', async () => {
    prismaMock.broker.update.mockResolvedValue({ id: 'broker-1' });

    await service.updateBroker({
      id: 'broker-1',
      code: 'NEW-CODE',
      description: '신규 설명',
      apiBaseUrl: 'https://new.example.com',
      isActive: false,
    });

    expect(prismaMock.broker.update).toHaveBeenCalledWith({
      where: { id: 'broker-1' },
      data: {
        code: 'NEW-CODE',
        description: '신규 설명',
        apiBaseUrl: 'https://new.example.com',
        isActive: false,
      },
    });
  });

  it('deleteBroker는 삭제 여부를 boolean으로 반환한다', async () => {
    prismaMock.broker.deleteMany.mockResolvedValue({ count: 1 });

    await expect(service.deleteBroker('broker-1')).resolves.toBe(true);
  });

  it('deleteBroker는 삭제된 항목이 없으면 false를 반환한다', async () => {
    prismaMock.broker.deleteMany.mockResolvedValue({ count: 0 });

    await expect(service.deleteBroker('broker-1')).resolves.toBe(false);
  });
});
