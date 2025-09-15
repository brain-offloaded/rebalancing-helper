import { Injectable } from '@nestjs/common';
import { BrokerageAccount, BrokerageHolding } from './brokerage.entities';
import { CreateBrokerageAccountInput, UpdateBrokerageAccountInput } from './brokerage.dto';

@Injectable()
export class BrokerageService {
  private accounts: BrokerageAccount[] = [];
  private holdings: BrokerageHolding[] = [];

  async createAccount(input: CreateBrokerageAccountInput): Promise<BrokerageAccount> {
    const account: BrokerageAccount = {
      id: Date.now().toString(),
      name: input.name,
      brokerName: input.brokerName,
      description: input.description,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.accounts.push(account);
    return account;
  }

  async updateAccount(input: UpdateBrokerageAccountInput): Promise<BrokerageAccount> {
    const accountIndex = this.accounts.findIndex(acc => acc.id === input.id);
    if (accountIndex === -1) {
      throw new Error('Account not found');
    }

    const account = this.accounts[accountIndex];
    this.accounts[accountIndex] = {
      ...account,
      ...input,
      updatedAt: new Date(),
    };

    return this.accounts[accountIndex];
  }

  async deleteAccount(id: string): Promise<boolean> {
    const accountIndex = this.accounts.findIndex(acc => acc.id === id);
    if (accountIndex === -1) {
      return false;
    }

    this.accounts.splice(accountIndex, 1);
    // Also remove related holdings
    this.holdings = this.holdings.filter(holding => holding.accountId !== id);
    return true;
  }

  async getAccounts(): Promise<BrokerageAccount[]> {
    return this.accounts;
  }

  async getAccount(id: string): Promise<BrokerageAccount | null> {
    return this.accounts.find(acc => acc.id === id) || null;
  }

  async getHoldings(accountId?: string): Promise<BrokerageHolding[]> {
    if (accountId) {
      return this.holdings.filter(holding => holding.accountId === accountId);
    }
    return this.holdings;
  }

  async refreshHoldings(accountId: string): Promise<BrokerageHolding[]> {
    // Mock data for demonstration - in real implementation, this would call the brokerage API
    const mockHoldings: BrokerageHolding[] = [
      {
        id: `${accountId}-holding-1`,
        symbol: 'SPY',
        name: 'SPDR S&P 500 ETF Trust',
        quantity: 10,
        currentPrice: 425.50,
        marketValue: 4255.00,
        averageCost: 420.00,
        currency: 'USD',
        accountId,
        lastUpdated: new Date(),
      },
      {
        id: `${accountId}-holding-2`,
        symbol: 'VTI',
        name: 'Vanguard Total Stock Market ETF',
        quantity: 5,
        currentPrice: 248.30,
        marketValue: 1241.50,
        averageCost: 245.00,
        currency: 'USD',
        accountId,
        lastUpdated: new Date(),
      },
    ];

    // Remove existing holdings for this account and add new ones
    this.holdings = this.holdings.filter(holding => holding.accountId !== accountId);
    this.holdings.push(...mockHoldings);

    return mockHoldings;
  }
}