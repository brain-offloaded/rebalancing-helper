import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Broker as BrokerModel,
  HoldingSource as PrismaHoldingSource,
  Prisma,
  Holding as PrismaHolding,
  HoldingAccount as PrismaHoldingAccount,
  HoldingAccountProviderType as PrismaHoldingAccountProviderType,
  HoldingAccountSyncMode as PrismaHoldingAccountSyncMode,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  BrokerageAccount,
  BrokerageAccountSyncMode,
} from './brokerage.entities';
import {
  CreateBrokerInput,
  CreateBrokerageAccountInput,
  UpdateBrokerInput,
  UpdateBrokerageAccountInput,
} from './brokerage.dto';
import { CredentialCryptoService } from './credential-crypto.service';
import { Holding, HoldingSource } from '../holdings/holdings.entities';

@Injectable()
export class BrokerageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly credentialCrypto: CredentialCryptoService,
  ) {}

  private mapHolding(holding: PrismaHolding): Holding {
    return {
      ...holding,
      source: holding.source as HoldingSource,
    };
  }

  private mapAccount(
    account: PrismaHoldingAccount & { broker: BrokerModel | null },
  ): BrokerageAccount {
    if (!account.broker) {
      throw new NotFoundException('Broker not found');
    }

    return {
      id: account.id,
      name: account.name,
      brokerId: account.brokerId!,
      syncMode: account.syncMode as BrokerageAccountSyncMode,
      description: account.description ?? null,
      isActive: account.isActive,
      broker: account.broker,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    };
  }

  listBrokers(): Promise<BrokerModel[]> {
    return this.prisma.broker.findMany({
      orderBy: { name: 'asc' },
    });
  }

  createBroker(input: CreateBrokerInput): Promise<BrokerModel> {
    return this.prisma.broker.create({
      data: {
        code: input.code,
        name: input.name,
        description: input.description ?? null,
        apiBaseUrl: input.apiBaseUrl ?? null,
      },
    });
  }

  async updateBroker(input: UpdateBrokerInput): Promise<BrokerModel> {
    const { id, ...updates } = input;
    const data: Prisma.BrokerUpdateInput = {};

    if (updates.code !== undefined) {
      data.code = updates.code;
    }

    if (updates.name !== undefined) {
      data.name = updates.name;
    }

    if (updates.description !== undefined) {
      data.description = updates.description ?? null;
    }

    if (updates.apiBaseUrl !== undefined) {
      data.apiBaseUrl = updates.apiBaseUrl ?? null;
    }

    if (updates.isActive !== undefined) {
      data.isActive = updates.isActive;
    }

    return this.prisma.broker.update({
      where: { id },
      data,
    });
  }

  async deleteBroker(id: string): Promise<boolean> {
    const result = await this.prisma.broker.deleteMany({
      where: { id },
    });

    return result.count > 0;
  }

  async createAccount(
    userId: string,
    input: CreateBrokerageAccountInput,
  ): Promise<BrokerageAccount> {
    if (
      input.syncMode === BrokerageAccountSyncMode.API &&
      !input.apiKey
    ) {
      throw new BadRequestException('API 동기화 모드에는 API 키가 필요합니다.');
    }

    const encryptedApiKey =
      input.syncMode === BrokerageAccountSyncMode.API && input.apiKey
        ? this.credentialCrypto.encrypt(input.apiKey)
        : null;
    const encryptedApiSecret =
      input.syncMode === BrokerageAccountSyncMode.API && input.apiSecret
        ? this.credentialCrypto.encrypt(input.apiSecret)
        : null;

    const data: Prisma.HoldingAccountCreateInput = {
      name: input.name,
      broker: {
        connect: { id: input.brokerId },
      },
      providerType: PrismaHoldingAccountProviderType.BROKERAGE,
      syncMode: input.syncMode as PrismaHoldingAccountSyncMode,
      apiKeyCipher: encryptedApiKey?.cipher ?? null,
      apiKeyIv: encryptedApiKey?.iv ?? null,
      apiKeyTag: encryptedApiKey?.authTag ?? null,
      apiSecretCipher: encryptedApiSecret?.cipher ?? null,
      apiSecretIv: encryptedApiSecret?.iv ?? null,
      apiSecretTag: encryptedApiSecret?.authTag ?? null,
      description: input.description ?? null,
      isActive: input.isActive ?? true,
      user: {
        connect: { id: userId },
      },
    };

    const account = await this.prisma.holdingAccount.create({
      data,
      include: { broker: true },
    });

    return this.mapAccount(account);
  }

  async updateAccount(
    userId: string,
    input: UpdateBrokerageAccountInput,
  ): Promise<BrokerageAccount> {
    const { id, ...updates } = input;
    const data: Prisma.HoldingAccountUpdateInput = {};

    if (updates.name !== undefined) {
      data.name = updates.name;
    }

    if (updates.brokerId !== undefined) {
      data.broker = {
        connect: { id: updates.brokerId },
      };
    }

    if (updates.syncMode !== undefined) {
      data.syncMode = updates.syncMode as PrismaHoldingAccountSyncMode;
      if (updates.syncMode === BrokerageAccountSyncMode.MANUAL) {
        data.apiKeyCipher = null;
        data.apiKeyIv = null;
        data.apiKeyTag = null;
        data.apiSecretCipher = null;
        data.apiSecretIv = null;
        data.apiSecretTag = null;
      }
    }

    if (updates.apiKey !== undefined) {
      if (!updates.apiKey) {
        data.apiKeyCipher = null;
        data.apiKeyIv = null;
        data.apiKeyTag = null;
      } else {
        const encryptedApiKey = this.credentialCrypto.encrypt(updates.apiKey);
        data.apiKeyCipher = encryptedApiKey.cipher;
        data.apiKeyIv = encryptedApiKey.iv;
        data.apiKeyTag = encryptedApiKey.authTag;
      }
    }

    if (updates.apiSecret !== undefined) {
      if (updates.apiSecret === null) {
        data.apiSecretCipher = null;
        data.apiSecretIv = null;
        data.apiSecretTag = null;
      } else {
        const encryptedApiSecret = this.credentialCrypto.encrypt(
          updates.apiSecret,
        );
        data.apiSecretCipher = encryptedApiSecret.cipher;
        data.apiSecretIv = encryptedApiSecret.iv;
        data.apiSecretTag = encryptedApiSecret.authTag;
      }
    }

    if (updates.description !== undefined) {
      data.description = updates.description ?? null;
    }

    if (updates.isActive !== undefined) {
      data.isActive = updates.isActive;
    }

    const existing = await this.prisma.holdingAccount.findFirst({
      where: {
        id,
        userId,
        providerType: PrismaHoldingAccountProviderType.BROKERAGE,
      },
      select: {
        id: true,
        syncMode: true,
        apiKeyCipher: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Brokerage account not found');
    }

    if (
      updates.syncMode === BrokerageAccountSyncMode.API &&
      !updates.apiKey &&
      !existing.apiKeyCipher
    ) {
      throw new BadRequestException('API 동기화 모드에는 API 키가 필요합니다.');
    }

    return this.prisma.holdingAccount
      .update({
        where: { id },
        data,
        include: { broker: true },
      })
      .then((account) => this.mapAccount(account));
  }

  async deleteAccount(userId: string, id: string): Promise<boolean> {
    try {
      const existing = await this.prisma.holdingAccount.findFirst({
        where: {
          id,
          userId,
          providerType: PrismaHoldingAccountProviderType.BROKERAGE,
        },
        select: { id: true },
      });

      if (!existing) {
        return false;
      }

      await this.prisma.holdingAccount.delete({ where: { id } });
      return true;
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        return false;
      }
      throw error;
    }
  }

  async getAccounts(userId: string): Promise<BrokerageAccount[]> {
    const accounts = await this.prisma.holdingAccount.findMany({
      where: {
        userId,
        providerType: PrismaHoldingAccountProviderType.BROKERAGE,
      },
      orderBy: { createdAt: 'asc' },
      include: { broker: true },
    });

    return accounts.map((account) => this.mapAccount(account));
  }

  async getAccount(
    userId: string,
    id: string,
  ): Promise<BrokerageAccount | null> {
    const account = await this.prisma.holdingAccount.findFirst({
      where: {
        id,
        userId,
        providerType: PrismaHoldingAccountProviderType.BROKERAGE,
      },
      include: { broker: true },
    });

    return account ? this.mapAccount(account) : null;
  }

  async getHoldings(userId: string, accountId?: string): Promise<Holding[]> {
    const normalizedAccountId = accountId ?? undefined;

    if (normalizedAccountId) {
      const account = await this.prisma.holdingAccount.findFirst({
        where: {
          id: normalizedAccountId,
          userId,
          providerType: PrismaHoldingAccountProviderType.BROKERAGE,
        },
        select: { id: true },
      });

      if (!account) {
        throw new NotFoundException('Account not found');
      }
    }

    const results = await this.prisma.holding.findMany({
      where: {
        userId,
        source: PrismaHoldingSource.BROKERAGE,
        ...(normalizedAccountId ? { accountId: normalizedAccountId } : {}),
      },
      orderBy: { symbol: 'asc' },
    });

    return results.map((holding) => this.mapHolding(holding));
  }

  async refreshHoldings(userId: string, accountId: string): Promise<Holding[]> {
    const account = await this.prisma.holdingAccount.findFirst({
      where: {
        id: accountId,
        userId,
        providerType: PrismaHoldingAccountProviderType.BROKERAGE,
      },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    if (account.syncMode !== PrismaHoldingAccountSyncMode.API) {
      throw new BadRequestException('해당 계좌는 자동 동기화를 지원하지 않습니다.');
    }

    const mockHoldings = [
      {
        id: `${accountId}-holding-1`,
        symbol: 'SPY',
        name: 'SPDR S&P 500 ETF Trust',
        quantity: 10,
        currentPrice: 425.5,
        marketValue: 4255.0,
        averageCost: 420.0,
        currency: 'USD',
      },
      {
        id: `${accountId}-holding-2`,
        symbol: 'VTI',
        name: 'Vanguard Total Stock Market ETF',
        quantity: 5,
        currentPrice: 248.3,
        marketValue: 1241.5,
        averageCost: 245.0,
        currency: 'USD',
      },
    ];

    await this.prisma.$transaction([
      this.prisma.holding.deleteMany({
        where: { accountId, source: PrismaHoldingSource.BROKERAGE },
      }),
      this.prisma.holding.createMany({
        data: mockHoldings.map((holding) => ({
          id: holding.id,
          userId: account.userId,
          source: PrismaHoldingSource.BROKERAGE,
          accountId,
          market: null,
          symbol: holding.symbol,
          name: holding.name,
          quantity: holding.quantity,
          currentPrice: holding.currentPrice,
          marketValue: holding.marketValue,
          averageCost: holding.averageCost ?? null,
          currency: holding.currency,
          lastUpdated: new Date(),
        })),
      }),
    ]);

    return this.getHoldings(userId, accountId);
  }
}
