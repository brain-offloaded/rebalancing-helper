import { Injectable } from '@nestjs/common';
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

  createAccount(input: CreateBrokerageAccountInput): Promise<BrokerageAccount> {
    const data: Prisma.BrokerageAccountCreateInput = {
      name: input.name,
      brokerName: input.brokerName,
      apiKey: input.apiKey,
      ...(input.description !== undefined
        ? { description: input.description }
        : {}),
      ...(input.apiSecret !== undefined ? { apiSecret: input.apiSecret } : {}),
      ...(input.apiBaseUrl !== undefined
        ? { apiBaseUrl: input.apiBaseUrl }
        : {}),
    };

    return this.prisma.brokerageAccount.create({
      data,
    });
  }

  updateAccount(input: UpdateBrokerageAccountInput): Promise<BrokerageAccount> {
    const { id, ...updates } = input;
    const data: Prisma.BrokerageAccountUpdateInput = {
      ...(updates.name !== undefined ? { name: updates.name } : {}),
      ...(updates.apiKey !== undefined ? { apiKey: updates.apiKey } : {}),
      ...(updates.apiSecret !== undefined
        ? { apiSecret: updates.apiSecret }
        : {}),
      ...(updates.apiBaseUrl !== undefined
        ? { apiBaseUrl: updates.apiBaseUrl }
        : {}),
      ...(updates.description !== undefined
        ? { description: updates.description }
        : {}),
    };

    return this.prisma.brokerageAccount.update({
      where: { id },
      data,
    });
  }

  async deleteAccount(id: string): Promise<boolean> {
    try {
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

  getAccounts(): Promise<BrokerageAccount[]> {
    return this.prisma.brokerageAccount.findMany({
      orderBy: { createdAt: 'asc' },
    });
  }

  getAccount(id: string): Promise<BrokerageAccount | null> {
    return this.prisma.brokerageAccount.findUnique({ where: { id } });
  }

  getHoldings(accountId?: string | null): Promise<BrokerageHolding[]> {
    return this.prisma.brokerageHolding.findMany({
      where: accountId ? { accountId } : undefined,
      orderBy: { symbol: 'asc' },
    });
  }

  async refreshHoldings(accountId: string): Promise<BrokerageHolding[]> {
    const account = await this.prisma.brokerageAccount.findUnique({
      where: { id: accountId },
    });
    if (!account) {
      throw new Error('Account not found');
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

    return this.getHoldings(accountId);
  }
}
