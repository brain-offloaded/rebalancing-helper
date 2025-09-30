import { Injectable, NotFoundException } from '@nestjs/common';
import {
  Broker as BrokerModel,
  HoldingSource as PrismaHoldingSource,
  Prisma,
  Holding as PrismaHolding,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BrokerageAccount } from './brokerage.entities';
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

  createAccount(
    userId: string,
    input: CreateBrokerageAccountInput,
  ): Promise<BrokerageAccount> {
    const encryptedApiKey = this.credentialCrypto.encrypt(input.apiKey);
    const encryptedApiSecret = input.apiSecret
      ? this.credentialCrypto.encrypt(input.apiSecret)
      : null;

    const data: Prisma.BrokerageAccountCreateInput = {
      name: input.name,
      broker: {
        connect: { id: input.brokerId },
      },
      apiKeyCipher: encryptedApiKey.cipher,
      apiKeyIv: encryptedApiKey.iv,
      apiKeyTag: encryptedApiKey.authTag,
      apiSecretCipher: encryptedApiSecret?.cipher ?? null,
      apiSecretIv: encryptedApiSecret?.iv ?? null,
      apiSecretTag: encryptedApiSecret?.authTag ?? null,
      description: input.description ?? null,
      isActive: input.isActive ?? true,
      user: {
        connect: { id: userId },
      },
    };

    return this.prisma.brokerageAccount.create({
      data,
      include: { broker: true },
    });
  }

  async updateAccount(
    userId: string,
    input: UpdateBrokerageAccountInput,
  ): Promise<BrokerageAccount> {
    const { id, ...updates } = input;
    const data: Prisma.BrokerageAccountUpdateInput = {};

    if (updates.name !== undefined) {
      data.name = updates.name;
    }

    if (updates.brokerId !== undefined) {
      data.broker = {
        connect: { id: updates.brokerId },
      };
    }

    if (updates.apiKey !== undefined) {
      const encryptedApiKey = this.credentialCrypto.encrypt(updates.apiKey);
      data.apiKeyCipher = encryptedApiKey.cipher;
      data.apiKeyIv = encryptedApiKey.iv;
      data.apiKeyTag = encryptedApiKey.authTag;
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

    const existing = await this.prisma.brokerageAccount.findFirst({
      where: { id, userId },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Brokerage account not found');
    }

    return this.prisma.brokerageAccount.update({
      where: { id },
      data,
      include: { broker: true },
    });
  }

  async deleteAccount(userId: string, id: string): Promise<boolean> {
    try {
      const existing = await this.prisma.brokerageAccount.findFirst({
        where: { id, userId },
        select: { id: true },
      });

      if (!existing) {
        return false;
      }

      await this.prisma.brokerageAccount.delete({ where: { id } });
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

  getAccounts(userId: string): Promise<BrokerageAccount[]> {
    return this.prisma.brokerageAccount.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      include: { broker: true },
    });
  }

  getAccount(userId: string, id: string): Promise<BrokerageAccount | null> {
    return this.prisma.brokerageAccount.findFirst({
      where: { id, userId },
      include: { broker: true },
    });
  }

  async getHoldings(userId: string, accountId?: string): Promise<Holding[]> {
    const normalizedAccountId = accountId ?? undefined;

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
    const account = await this.prisma.brokerageAccount.findUnique({
      where: { id: accountId },
    });
    if (!account || account.userId !== userId) {
      throw new NotFoundException('Account not found');
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
