import type { DecimalInput } from '@rebalancing-helper/common';

export interface Holding {
  id: string;
  source: 'BROKERAGE' | 'MANUAL';
  accountId: string;
  market: string | null;
  symbol: string;
  name: string;
  alias: string | null;
  quantity: DecimalInput;
  currentPrice: DecimalInput;
  marketValue: DecimalInput;
  currency: string;
  lastUpdated: string;
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: string;
  name: string;
  description: string | null;
  color: string;
}

export interface ManualAccount {
  id: string;
  name: string;
  broker?: {
    name?: string | null;
  } | null;
}

export interface MarketOption {
  id: string;
  code: string;
  displayName: string;
}

export interface HoldingTagLink {
  holdingSymbol: string;
  tagId: string;
}

export type HoldingSortField =
  | 'account'
  | 'displayName'
  | 'quantity'
  | 'currentPrice'
  | 'marketValue'
  | 'lastUpdated'
  | 'tags';

export type HoldingSortDirection = 'asc' | 'desc';

export interface HoldingSortConfig {
  field: HoldingSortField | null;
  direction: HoldingSortDirection;
}
