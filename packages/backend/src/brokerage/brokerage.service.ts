import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BrokerageAccount, BrokerageHolding } from './brokerage.entities';
import {
  CreateBrokerageAccountInput,
  UpdateBrokerageAccountInput,
} from './brokerage.dto';

@Injectable()
export class BrokerageService {
  constructor(private readonly prisma: PrismaService) {}

  createAccount(
    userId: string,
    input: CreateBrokerageAccountInput,
  ): Promise<BrokerageAccount> {
    const data: Prisma.BrokerageAccountCreateInput = {
      name: input.name,
      brokerName: input.brokerName,
      apiKey: input.apiKey,
      description: input.description ?? null,
      apiSecret: input.apiSecret ?? null,
      apiBaseUrl: input.apiBaseUrl ?? null,
      user: {
        connect: { id: userId },
      },
    };

    return this.prisma.brokerageAccount.create({
      data,
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

    if (updates.apiKey !== undefined) {
      data.apiKey = updates.apiKey;
    }

    if (updates.apiSecret !== undefined) {
      data.apiSecret = updates.apiSecret ?? null;
    }

    if (updates.apiBaseUrl !== undefined) {
      data.apiBaseUrl = updates.apiBaseUrl ?? null;
    }

    if (updates.description !== undefined) {
      data.description = updates.description ?? null;
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
    });
  }

  getAccount(userId: string, id: string): Promise<BrokerageAccount | null> {
    return this.prisma.brokerageAccount.findFirst({
      where: { id, userId },
    });
  }

  getHoldings(userId: string, accountId?: string): Promise<BrokerageHolding[]> {
    const normalizedAccountId = accountId ?? undefined;

    return this.prisma.brokerageHolding.findMany({
      where: {
        account: {
          userId,
        },
        ...(normalizedAccountId ? { accountId: normalizedAccountId } : {}),
      },
      orderBy: { symbol: 'asc' },
    });
  }

  async refreshHoldings(
    userId: string,
    accountId: string,
  ): Promise<BrokerageHolding[]> {
    const account = await this.prisma.brokerageAccount.findUnique({
      where: { id: accountId },
    });
    if (!account || account.userId !== userId) {
      throw new NotFoundException('Account not found');
    }

    const mockHoldings: BrokerageHolding[] = [
      {
        id: `${accountId}-holding-1`,
        symbol: 'SPY',
        name: 'SPDR S&P 500 ETF Trust',
        quantity: 10,
        currentPrice: 425.5,
        marketValue: 4255.0,
        averageCost: 420.0,
        currency: 'USD',
        accountId,
        lastUpdated: new Date(),
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
        accountId,
        lastUpdated: new Date(),
      },
    ];

    await this.prisma.$transaction([
      this.prisma.brokerageHolding.deleteMany({ where: { accountId } }),
      this.prisma.brokerageHolding.createMany({
        data: mockHoldings.map((holding) => ({
          id: holding.id,
          symbol: holding.symbol,
          name: holding.name,
          quantity: holding.quantity,
          currentPrice: holding.currentPrice,
          marketValue: holding.marketValue,
          averageCost: holding.averageCost ?? null,
          currency: holding.currency,
          accountId: holding.accountId,
          lastUpdated: holding.lastUpdated,
        })),
      }),
    ]);

    return this.getHoldings(userId, accountId);
  }
}
