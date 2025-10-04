import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K];
};
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]?: Maybe<T[SubKey]>;
};
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]: Maybe<T[SubKey]>;
};
export type MakeEmpty<
  T extends { [key: string]: unknown },
  K extends keyof T,
> = { [_ in K]?: never };
export type Incremental<T> =
  | T
  | {
      [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never;
    };
const defaultOptions = {} as const;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
  Int: { input: number; output: number };
  Float: { input: number; output: number };
  /** A date-time string at UTC, such as 2019-12-03T09:54:33Z, compliant with the date-time format. */
  DateTime: { input: string; output: string };
};

export type AddHoldingTagInput = {
  holdingSymbol: Scalars['String']['input'];
  tagId: Scalars['String']['input'];
};

export type AddTagsToRebalancingGroupInput = {
  groupId: Scalars['String']['input'];
  tagIds: Array<Scalars['String']['input']>;
};

export type AuthPayload = {
  __typename?: 'AuthPayload';
  accessToken: Scalars['String']['output'];
  user: User;
};

export type Broker = {
  __typename?: 'Broker';
  apiBaseUrl: Maybe<Scalars['String']['output']>;
  code: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  description: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type BrokerageAccount = {
  __typename?: 'BrokerageAccount';
  broker: Broker;
  brokerId: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  description: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  syncMode: BrokerageAccountSyncMode;
  updatedAt: Scalars['DateTime']['output'];
};

export type BrokerageAccountSyncMode = 'API' | 'MANUAL';

export type CalculateInvestmentInput = {
  groupId: Scalars['String']['input'];
  investmentAmount: Scalars['Float']['input'];
};

export type CreateBrokerInput = {
  apiBaseUrl: InputMaybe<Scalars['String']['input']>;
  code: Scalars['String']['input'];
  description: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
};

export type CreateBrokerageAccountInput = {
  apiKey: InputMaybe<Scalars['String']['input']>;
  apiSecret: InputMaybe<Scalars['String']['input']>;
  brokerId: Scalars['String']['input'];
  description: InputMaybe<Scalars['String']['input']>;
  isActive: InputMaybe<Scalars['Boolean']['input']>;
  name: Scalars['String']['input'];
  syncMode: BrokerageAccountSyncMode;
};

export type CreateManualHoldingInput = {
  accountId: Scalars['String']['input'];
  market: Scalars['String']['input'];
  quantity: Scalars['Float']['input'];
  symbol: Scalars['String']['input'];
};

export type CreateRebalancingGroupInput = {
  description: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  tagIds: Array<Scalars['String']['input']>;
};

export type CreateTagInput = {
  color: Scalars['String']['input'];
  description: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
};

export type Holding = {
  __typename?: 'Holding';
  accountId: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  currency: Scalars['String']['output'];
  currentPrice: Scalars['Float']['output'];
  id: Scalars['ID']['output'];
  lastUpdated: Scalars['DateTime']['output'];
  market: Maybe<Scalars['String']['output']>;
  marketValue: Scalars['Float']['output'];
  name: Scalars['String']['output'];
  quantity: Scalars['Float']['output'];
  source: HoldingSource;
  symbol: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type HoldingSource = 'BROKERAGE' | 'MANUAL';

export type HoldingTag = {
  __typename?: 'HoldingTag';
  createdAt: Scalars['DateTime']['output'];
  holdingSymbol: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  tagId: Scalars['String']['output'];
};

export type IncreaseManualHoldingInput = {
  accountId: Scalars['String']['input'];
  market: Scalars['String']['input'];
  quantityDelta: Scalars['Float']['input'];
  symbol: Scalars['String']['input'];
};

export type InvestmentRecommendation = {
  __typename?: 'InvestmentRecommendation';
  baseCurrency: Scalars['String']['output'];
  recommendedAmount: Scalars['Float']['output'];
  recommendedPercentage: Scalars['Float']['output'];
  suggestedSymbols: Array<Scalars['String']['output']>;
  tagId: Scalars['String']['output'];
  tagName: Scalars['String']['output'];
};

export type LoginInput = {
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
};

export type ManualHoldingIdentifierInput = {
  accountId: Scalars['String']['input'];
  market: Scalars['String']['input'];
  symbol: Scalars['String']['input'];
};

export type Market = {
  __typename?: 'Market';
  code: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  displayName: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  updatedAt: Scalars['DateTime']['output'];
  yahooMarketIdentifiers: Array<Scalars['String']['output']>;
  yahooSuffix: Maybe<Scalars['String']['output']>;
};

export type Mutation = {
  __typename?: 'Mutation';
  addHoldingTag: HoldingTag;
  addTagsToRebalancingGroup: RebalancingGroup;
  createBroker: Broker;
  createBrokerageAccount: BrokerageAccount;
  createManualHolding: Holding;
  createRebalancingGroup: RebalancingGroup;
  createTag: Tag;
  deleteBroker: Scalars['Boolean']['output'];
  deleteBrokerageAccount: Scalars['Boolean']['output'];
  deleteManualHolding: Scalars['Boolean']['output'];
  deleteRebalancingGroup: Scalars['Boolean']['output'];
  deleteTag: Scalars['Boolean']['output'];
  increaseManualHolding: Holding;
  login: AuthPayload;
  refreshBrokerageHoldings: Array<Holding>;
  register: AuthPayload;
  removeHoldingTag: Scalars['Boolean']['output'];
  removeTagsFromRebalancingGroup: RebalancingGroup;
  renameRebalancingGroup: RebalancingGroup;
  setHoldingTags: Array<HoldingTag>;
  setManualHoldingQuantity: Holding;
  setTargetAllocations: Scalars['Boolean']['output'];
  syncManualHoldingPrice: Holding;
  updateBroker: Broker;
  updateBrokerageAccount: BrokerageAccount;
  updateRebalancingGroup: RebalancingGroup;
  updateTag: Tag;
};

export type MutationAddHoldingTagArgs = {
  input: AddHoldingTagInput;
};

export type MutationAddTagsToRebalancingGroupArgs = {
  input: AddTagsToRebalancingGroupInput;
};

export type MutationCreateBrokerArgs = {
  input: CreateBrokerInput;
};

export type MutationCreateBrokerageAccountArgs = {
  input: CreateBrokerageAccountInput;
};

export type MutationCreateManualHoldingArgs = {
  input: CreateManualHoldingInput;
};

export type MutationCreateRebalancingGroupArgs = {
  input: CreateRebalancingGroupInput;
};

export type MutationCreateTagArgs = {
  input: CreateTagInput;
};

export type MutationDeleteBrokerArgs = {
  id: Scalars['String']['input'];
};

export type MutationDeleteBrokerageAccountArgs = {
  id: Scalars['String']['input'];
};

export type MutationDeleteManualHoldingArgs = {
  input: ManualHoldingIdentifierInput;
};

export type MutationDeleteRebalancingGroupArgs = {
  id: Scalars['String']['input'];
};

export type MutationDeleteTagArgs = {
  id: Scalars['String']['input'];
};

export type MutationIncreaseManualHoldingArgs = {
  input: IncreaseManualHoldingInput;
};

export type MutationLoginArgs = {
  input: LoginInput;
};

export type MutationRefreshBrokerageHoldingsArgs = {
  accountId: Scalars['String']['input'];
};

export type MutationRegisterArgs = {
  input: RegisterInput;
};

export type MutationRemoveHoldingTagArgs = {
  input: RemoveHoldingTagInput;
};

export type MutationRemoveTagsFromRebalancingGroupArgs = {
  input: RemoveTagsFromRebalancingGroupInput;
};

export type MutationRenameRebalancingGroupArgs = {
  input: RenameRebalancingGroupInput;
};

export type MutationSetHoldingTagsArgs = {
  input: SetHoldingTagsInput;
};

export type MutationSetManualHoldingQuantityArgs = {
  input: SetManualHoldingQuantityInput;
};

export type MutationSetTargetAllocationsArgs = {
  input: SetTargetAllocationsInput;
};

export type MutationSyncManualHoldingPriceArgs = {
  input: ManualHoldingIdentifierInput;
};

export type MutationUpdateBrokerArgs = {
  input: UpdateBrokerInput;
};

export type MutationUpdateBrokerageAccountArgs = {
  input: UpdateBrokerageAccountInput;
};

export type MutationUpdateRebalancingGroupArgs = {
  input: UpdateRebalancingGroupInput;
};

export type MutationUpdateTagArgs = {
  input: UpdateTagInput;
};

export type Query = {
  __typename?: 'Query';
  brokerageAccount: Maybe<BrokerageAccount>;
  brokerageAccounts: Array<BrokerageAccount>;
  brokerageHoldings: Array<Holding>;
  brokers: Array<Broker>;
  holdingTags: Array<HoldingTag>;
  holdings: Array<Holding>;
  holdingsForTag: Array<Scalars['String']['output']>;
  investmentRecommendation: Array<InvestmentRecommendation>;
  markets: Array<Market>;
  me: User;
  rebalancingAnalysis: RebalancingAnalysis;
  rebalancingGroup: Maybe<RebalancingGroup>;
  rebalancingGroups: Array<RebalancingGroup>;
  tag: Maybe<Tag>;
  tags: Array<Tag>;
  tagsForHolding: Array<Scalars['String']['output']>;
};

export type QueryBrokerageAccountArgs = {
  id: Scalars['String']['input'];
};

export type QueryBrokerageHoldingsArgs = {
  accountId: InputMaybe<Scalars['String']['input']>;
};

export type QueryHoldingTagsArgs = {
  holdingSymbol: InputMaybe<Scalars['String']['input']>;
};

export type QueryHoldingsArgs = {
  accountId: InputMaybe<Scalars['String']['input']>;
  source: InputMaybe<HoldingSource>;
};

export type QueryHoldingsForTagArgs = {
  tagId: Scalars['String']['input'];
};

export type QueryInvestmentRecommendationArgs = {
  input: CalculateInvestmentInput;
};

export type QueryRebalancingAnalysisArgs = {
  groupId: Scalars['String']['input'];
};

export type QueryRebalancingGroupArgs = {
  id: Scalars['String']['input'];
};

export type QueryTagArgs = {
  id: Scalars['String']['input'];
};

export type QueryTagsForHoldingArgs = {
  holdingSymbol: Scalars['String']['input'];
};

export type RebalancingAnalysis = {
  __typename?: 'RebalancingAnalysis';
  allocations: Array<TagAllocation>;
  baseCurrency: Scalars['String']['output'];
  groupId: Scalars['ID']['output'];
  groupName: Scalars['String']['output'];
  lastUpdated: Scalars['DateTime']['output'];
  totalValue: Scalars['Float']['output'];
};

export type RebalancingGroup = {
  __typename?: 'RebalancingGroup';
  createdAt: Scalars['DateTime']['output'];
  description: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  tagIds: Array<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
};

export type RegisterInput = {
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
};

export type RemoveHoldingTagInput = {
  holdingSymbol: Scalars['String']['input'];
  tagId: Scalars['String']['input'];
};

export type RemoveTagsFromRebalancingGroupInput = {
  groupId: Scalars['String']['input'];
  tagIds: Array<Scalars['String']['input']>;
};

export type RenameRebalancingGroupInput = {
  groupId: Scalars['String']['input'];
  name: Scalars['String']['input'];
};

export type SetHoldingTagsInput = {
  holdingSymbol: Scalars['String']['input'];
  tagIds: Array<Scalars['String']['input']>;
};

export type SetManualHoldingQuantityInput = {
  accountId: Scalars['String']['input'];
  market: Scalars['String']['input'];
  quantity: Scalars['Float']['input'];
  symbol: Scalars['String']['input'];
};

export type SetTargetAllocationsInput = {
  groupId: Scalars['String']['input'];
  targets: Array<TagTargetInput>;
};

export type Tag = {
  __typename?: 'Tag';
  color: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  description: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type TagAllocation = {
  __typename?: 'TagAllocation';
  currentPercentage: Scalars['Float']['output'];
  currentValue: Scalars['Float']['output'];
  difference: Scalars['Float']['output'];
  tagColor: Scalars['String']['output'];
  tagId: Scalars['String']['output'];
  tagName: Scalars['String']['output'];
  targetPercentage: Scalars['Float']['output'];
};

export type TagTargetInput = {
  tagId: Scalars['String']['input'];
  targetPercentage: Scalars['Float']['input'];
};

export type UpdateBrokerInput = {
  apiBaseUrl: InputMaybe<Scalars['String']['input']>;
  code: InputMaybe<Scalars['String']['input']>;
  description: InputMaybe<Scalars['String']['input']>;
  id: Scalars['String']['input'];
  isActive: InputMaybe<Scalars['Boolean']['input']>;
  name: InputMaybe<Scalars['String']['input']>;
};

export type UpdateBrokerageAccountInput = {
  apiKey: InputMaybe<Scalars['String']['input']>;
  apiSecret: InputMaybe<Scalars['String']['input']>;
  brokerId: InputMaybe<Scalars['String']['input']>;
  description: InputMaybe<Scalars['String']['input']>;
  id: Scalars['String']['input'];
  isActive: InputMaybe<Scalars['Boolean']['input']>;
  name: InputMaybe<Scalars['String']['input']>;
  syncMode: InputMaybe<BrokerageAccountSyncMode>;
};

export type UpdateRebalancingGroupInput = {
  description: InputMaybe<Scalars['String']['input']>;
  id: Scalars['String']['input'];
  name: InputMaybe<Scalars['String']['input']>;
  tagIds: InputMaybe<Array<Scalars['String']['input']>>;
};

export type UpdateTagInput = {
  color: InputMaybe<Scalars['String']['input']>;
  description: InputMaybe<Scalars['String']['input']>;
  id: Scalars['String']['input'];
  name: InputMaybe<Scalars['String']['input']>;
};

export type User = {
  __typename?: 'User';
  createdAt: Scalars['DateTime']['output'];
  email: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type LoginMutationVariables = Exact<{
  input: LoginInput;
}>;

export type LoginMutation = {
  __typename?: 'Mutation';
  login: {
    __typename?: 'AuthPayload';
    accessToken: string;
    user: {
      __typename?: 'User';
      id: string;
      email: string;
      createdAt: string;
      updatedAt: string;
    };
  };
};

export type RegisterMutationVariables = Exact<{
  input: RegisterInput;
}>;

export type RegisterMutation = {
  __typename?: 'Mutation';
  register: {
    __typename?: 'AuthPayload';
    accessToken: string;
    user: {
      __typename?: 'User';
      id: string;
      email: string;
      createdAt: string;
      updatedAt: string;
    };
  };
};

export type MeQueryVariables = Exact<{ [key: string]: never }>;

export type MeQuery = {
  __typename?: 'Query';
  me: {
    __typename?: 'User';
    id: string;
    email: string;
    createdAt: string;
    updatedAt: string;
  };
};

export type GetBrokerageAccountsQueryVariables = Exact<{
  [key: string]: never;
}>;

export type GetBrokerageAccountsQuery = {
  __typename?: 'Query';
  brokerageAccounts: Array<{
    __typename?: 'BrokerageAccount';
    id: string;
    name: string;
    brokerId: string;
    syncMode: BrokerageAccountSyncMode;
    description: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    broker: {
      __typename?: 'Broker';
      id: string;
      name: string;
      code: string;
      isActive: boolean;
    };
  }>;
};

export type GetBrokersQueryVariables = Exact<{ [key: string]: never }>;

export type GetBrokersQuery = {
  __typename?: 'Query';
  brokers: Array<{
    __typename?: 'Broker';
    id: string;
    code: string;
    name: string;
    description: string | null;
    apiBaseUrl: string | null;
    isActive: boolean;
  }>;
};

export type GetBrokerageHoldingsQueryVariables = Exact<{
  accountId: InputMaybe<Scalars['String']['input']>;
}>;

export type GetBrokerageHoldingsQuery = {
  __typename?: 'Query';
  brokerageHoldings: Array<{
    __typename?: 'Holding';
    id: string;
    symbol: string;
    name: string;
    quantity: number;
    currentPrice: number;
    marketValue: number;
    currency: string;
    accountId: string;
    lastUpdated: string;
  }>;
};

export type CreateBrokerageAccountMutationVariables = Exact<{
  input: CreateBrokerageAccountInput;
}>;

export type CreateBrokerageAccountMutation = {
  __typename?: 'Mutation';
  createBrokerageAccount: {
    __typename?: 'BrokerageAccount';
    id: string;
    name: string;
    syncMode: BrokerageAccountSyncMode;
    description: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    broker: { __typename?: 'Broker'; id: string; name: string; code: string };
  };
};

export type UpdateBrokerageAccountMutationVariables = Exact<{
  input: UpdateBrokerageAccountInput;
}>;

export type UpdateBrokerageAccountMutation = {
  __typename?: 'Mutation';
  updateBrokerageAccount: {
    __typename?: 'BrokerageAccount';
    id: string;
    name: string;
    syncMode: BrokerageAccountSyncMode;
    description: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    broker: { __typename?: 'Broker'; id: string; name: string; code: string };
  };
};

export type CreateBrokerMutationVariables = Exact<{
  input: CreateBrokerInput;
}>;

export type CreateBrokerMutation = {
  __typename?: 'Mutation';
  createBroker: {
    __typename?: 'Broker';
    id: string;
    code: string;
    name: string;
    description: string | null;
    apiBaseUrl: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
};

export type UpdateBrokerMutationVariables = Exact<{
  input: UpdateBrokerInput;
}>;

export type UpdateBrokerMutation = {
  __typename?: 'Mutation';
  updateBroker: {
    __typename?: 'Broker';
    id: string;
    code: string;
    name: string;
    description: string | null;
    apiBaseUrl: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
};

export type DeleteBrokerMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;

export type DeleteBrokerMutation = {
  __typename?: 'Mutation';
  deleteBroker: boolean;
};

export type DeleteBrokerageAccountMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;

export type DeleteBrokerageAccountMutation = {
  __typename?: 'Mutation';
  deleteBrokerageAccount: boolean;
};

export type RefreshBrokerageHoldingsMutationVariables = Exact<{
  accountId: Scalars['String']['input'];
}>;

export type RefreshBrokerageHoldingsMutation = {
  __typename?: 'Mutation';
  refreshBrokerageHoldings: Array<{
    __typename?: 'Holding';
    id: string;
    symbol: string;
    name: string;
    quantity: number;
    currentPrice: number;
    marketValue: number;
    currency: string;
    accountId: string;
    lastUpdated: string;
  }>;
};

export type GetHoldingTagsQueryVariables = Exact<{
  holdingSymbol: InputMaybe<Scalars['String']['input']>;
}>;

export type GetHoldingTagsQuery = {
  __typename?: 'Query';
  holdingTags: Array<{
    __typename?: 'HoldingTag';
    id: string;
    holdingSymbol: string;
    tagId: string;
    createdAt: string;
  }>;
};

export type GetTagsForHoldingQueryVariables = Exact<{
  holdingSymbol: Scalars['String']['input'];
}>;

export type GetTagsForHoldingQuery = {
  __typename?: 'Query';
  tagsForHolding: Array<string>;
};

export type GetHoldingsForTagQueryVariables = Exact<{
  tagId: Scalars['String']['input'];
}>;

export type GetHoldingsForTagQuery = {
  __typename?: 'Query';
  holdingsForTag: Array<string>;
};

export type AddHoldingTagMutationVariables = Exact<{
  input: AddHoldingTagInput;
}>;

export type AddHoldingTagMutation = {
  __typename?: 'Mutation';
  addHoldingTag: {
    __typename?: 'HoldingTag';
    id: string;
    holdingSymbol: string;
    tagId: string;
    createdAt: string;
  };
};

export type RemoveHoldingTagMutationVariables = Exact<{
  input: RemoveHoldingTagInput;
}>;

export type RemoveHoldingTagMutation = {
  __typename?: 'Mutation';
  removeHoldingTag: boolean;
};

export type SetHoldingTagsMutationVariables = Exact<{
  input: SetHoldingTagsInput;
}>;

export type SetHoldingTagsMutation = {
  __typename?: 'Mutation';
  setHoldingTags: Array<{
    __typename?: 'HoldingTag';
    id: string;
    holdingSymbol: string;
    tagId: string;
    createdAt: string;
  }>;
};

export type GetHoldingsQueryVariables = Exact<{
  source: InputMaybe<HoldingSource>;
  accountId: InputMaybe<Scalars['String']['input']>;
}>;

export type GetHoldingsQuery = {
  __typename?: 'Query';
  holdings: Array<{
    __typename?: 'Holding';
    id: string;
    source: HoldingSource;
    accountId: string;
    market: string | null;
    symbol: string;
    name: string;
    quantity: number;
    currentPrice: number;
    marketValue: number;
    currency: string;
    lastUpdated: string;
    createdAt: string;
    updatedAt: string;
  }>;
};

export type CreateManualHoldingMutationVariables = Exact<{
  input: CreateManualHoldingInput;
}>;

export type CreateManualHoldingMutation = {
  __typename?: 'Mutation';
  createManualHolding: {
    __typename?: 'Holding';
    id: string;
    source: HoldingSource;
    accountId: string;
    market: string | null;
    symbol: string;
    name: string;
    quantity: number;
    currentPrice: number;
    marketValue: number;
    currency: string;
    lastUpdated: string;
    createdAt: string;
    updatedAt: string;
  };
};

export type IncreaseManualHoldingMutationVariables = Exact<{
  input: IncreaseManualHoldingInput;
}>;

export type IncreaseManualHoldingMutation = {
  __typename?: 'Mutation';
  increaseManualHolding: {
    __typename?: 'Holding';
    id: string;
    source: HoldingSource;
    accountId: string;
    market: string | null;
    symbol: string;
    name: string;
    quantity: number;
    currentPrice: number;
    marketValue: number;
    currency: string;
    lastUpdated: string;
    createdAt: string;
    updatedAt: string;
  };
};

export type SetManualHoldingQuantityMutationVariables = Exact<{
  input: SetManualHoldingQuantityInput;
}>;

export type SetManualHoldingQuantityMutation = {
  __typename?: 'Mutation';
  setManualHoldingQuantity: {
    __typename?: 'Holding';
    id: string;
    source: HoldingSource;
    accountId: string;
    market: string | null;
    symbol: string;
    name: string;
    quantity: number;
    currentPrice: number;
    marketValue: number;
    currency: string;
    lastUpdated: string;
    createdAt: string;
    updatedAt: string;
  };
};

export type DeleteManualHoldingMutationVariables = Exact<{
  input: ManualHoldingIdentifierInput;
}>;

export type DeleteManualHoldingMutation = {
  __typename?: 'Mutation';
  deleteManualHolding: boolean;
};

export type SyncManualHoldingPriceMutationVariables = Exact<{
  input: ManualHoldingIdentifierInput;
}>;

export type SyncManualHoldingPriceMutation = {
  __typename?: 'Mutation';
  syncManualHoldingPrice: {
    __typename?: 'Holding';
    id: string;
    source: HoldingSource;
    accountId: string;
    market: string | null;
    symbol: string;
    name: string;
    currentPrice: number;
    marketValue: number;
    lastUpdated: string;
    quantity: number;
    currency: string;
    createdAt: string;
    updatedAt: string;
  };
};

export type GetMarketsQueryVariables = Exact<{ [key: string]: never }>;

export type GetMarketsQuery = {
  __typename?: 'Query';
  markets: Array<{
    __typename?: 'Market';
    id: string;
    code: string;
    displayName: string;
    yahooSuffix: string | null;
  }>;
};

export type GetRebalancingGroupsQueryVariables = Exact<{
  [key: string]: never;
}>;

export type GetRebalancingGroupsQuery = {
  __typename?: 'Query';
  rebalancingGroups: Array<{
    __typename?: 'RebalancingGroup';
    id: string;
    name: string;
    description: string | null;
    tagIds: Array<string>;
    createdAt: string;
    updatedAt: string;
  }>;
};

export type GetRebalancingAnalysisQueryVariables = Exact<{
  groupId: Scalars['String']['input'];
}>;

export type GetRebalancingAnalysisQuery = {
  __typename?: 'Query';
  rebalancingAnalysis: {
    __typename?: 'RebalancingAnalysis';
    groupId: string;
    groupName: string;
    totalValue: number;
    baseCurrency: string;
    lastUpdated: string;
    allocations: Array<{
      __typename?: 'TagAllocation';
      tagId: string;
      tagName: string;
      tagColor: string;
      currentValue: number;
      currentPercentage: number;
      targetPercentage: number;
      difference: number;
    }>;
  };
};

export type GetInvestmentRecommendationQueryVariables = Exact<{
  input: CalculateInvestmentInput;
}>;

export type GetInvestmentRecommendationQuery = {
  __typename?: 'Query';
  investmentRecommendation: Array<{
    __typename?: 'InvestmentRecommendation';
    tagId: string;
    tagName: string;
    recommendedAmount: number;
    recommendedPercentage: number;
    suggestedSymbols: Array<string>;
    baseCurrency: string;
  }>;
};

export type CreateRebalancingGroupMutationVariables = Exact<{
  input: CreateRebalancingGroupInput;
}>;

export type CreateRebalancingGroupMutation = {
  __typename?: 'Mutation';
  createRebalancingGroup: {
    __typename?: 'RebalancingGroup';
    id: string;
    name: string;
    description: string | null;
    tagIds: Array<string>;
    createdAt: string;
    updatedAt: string;
  };
};

export type UpdateRebalancingGroupMutationVariables = Exact<{
  input: UpdateRebalancingGroupInput;
}>;

export type UpdateRebalancingGroupMutation = {
  __typename?: 'Mutation';
  updateRebalancingGroup: {
    __typename?: 'RebalancingGroup';
    id: string;
    name: string;
    description: string | null;
    tagIds: Array<string>;
    createdAt: string;
    updatedAt: string;
  };
};

export type DeleteRebalancingGroupMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;

export type DeleteRebalancingGroupMutation = {
  __typename?: 'Mutation';
  deleteRebalancingGroup: boolean;
};

export type SetTargetAllocationsMutationVariables = Exact<{
  input: SetTargetAllocationsInput;
}>;

export type SetTargetAllocationsMutation = {
  __typename?: 'Mutation';
  setTargetAllocations: boolean;
};

export type AddTagsToRebalancingGroupMutationVariables = Exact<{
  input: AddTagsToRebalancingGroupInput;
}>;

export type AddTagsToRebalancingGroupMutation = {
  __typename?: 'Mutation';
  addTagsToRebalancingGroup: {
    __typename?: 'RebalancingGroup';
    id: string;
    name: string;
    description: string | null;
    tagIds: Array<string>;
    createdAt: string;
    updatedAt: string;
  };
};

export type RemoveTagsFromRebalancingGroupMutationVariables = Exact<{
  input: RemoveTagsFromRebalancingGroupInput;
}>;

export type RemoveTagsFromRebalancingGroupMutation = {
  __typename?: 'Mutation';
  removeTagsFromRebalancingGroup: {
    __typename?: 'RebalancingGroup';
    id: string;
    name: string;
    description: string | null;
    tagIds: Array<string>;
    createdAt: string;
    updatedAt: string;
  };
};

export type RenameRebalancingGroupMutationVariables = Exact<{
  input: RenameRebalancingGroupInput;
}>;

export type RenameRebalancingGroupMutation = {
  __typename?: 'Mutation';
  renameRebalancingGroup: {
    __typename?: 'RebalancingGroup';
    id: string;
    name: string;
    description: string | null;
    tagIds: Array<string>;
    createdAt: string;
    updatedAt: string;
  };
};

export type GetTagsQueryVariables = Exact<{ [key: string]: never }>;

export type GetTagsQuery = {
  __typename?: 'Query';
  tags: Array<{
    __typename?: 'Tag';
    id: string;
    name: string;
    description: string | null;
    color: string;
    createdAt: string;
    updatedAt: string;
  }>;
};

export type CreateTagMutationVariables = Exact<{
  input: CreateTagInput;
}>;

export type CreateTagMutation = {
  __typename?: 'Mutation';
  createTag: {
    __typename?: 'Tag';
    id: string;
    name: string;
    description: string | null;
    color: string;
    createdAt: string;
    updatedAt: string;
  };
};

export type UpdateTagMutationVariables = Exact<{
  input: UpdateTagInput;
}>;

export type UpdateTagMutation = {
  __typename?: 'Mutation';
  updateTag: {
    __typename?: 'Tag';
    id: string;
    name: string;
    description: string | null;
    color: string;
    createdAt: string;
    updatedAt: string;
  };
};

export type DeleteTagMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;

export type DeleteTagMutation = { __typename?: 'Mutation'; deleteTag: boolean };

export const LoginDocument = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      accessToken
      user {
        id
        email
        createdAt
        updatedAt
      }
    }
  }
`;
export type LoginMutationFn = Apollo.MutationFunction<
  LoginMutation,
  LoginMutationVariables
>;

/**
 * __useLoginMutation__
 *
 * To run a mutation, you first call `useLoginMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useLoginMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [loginMutation, { data, loading, error }] = useLoginMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useLoginMutation(
  baseOptions?: Apollo.MutationHookOptions<
    LoginMutation,
    LoginMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<LoginMutation, LoginMutationVariables>(
    LoginDocument,
    options,
  );
}
export type LoginMutationHookResult = ReturnType<typeof useLoginMutation>;
export type LoginMutationResult = Apollo.MutationResult<LoginMutation>;
export type LoginMutationOptions = Apollo.BaseMutationOptions<
  LoginMutation,
  LoginMutationVariables
>;
export const RegisterDocument = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      accessToken
      user {
        id
        email
        createdAt
        updatedAt
      }
    }
  }
`;
export type RegisterMutationFn = Apollo.MutationFunction<
  RegisterMutation,
  RegisterMutationVariables
>;

/**
 * __useRegisterMutation__
 *
 * To run a mutation, you first call `useRegisterMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRegisterMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [registerMutation, { data, loading, error }] = useRegisterMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useRegisterMutation(
  baseOptions?: Apollo.MutationHookOptions<
    RegisterMutation,
    RegisterMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<RegisterMutation, RegisterMutationVariables>(
    RegisterDocument,
    options,
  );
}
export type RegisterMutationHookResult = ReturnType<typeof useRegisterMutation>;
export type RegisterMutationResult = Apollo.MutationResult<RegisterMutation>;
export type RegisterMutationOptions = Apollo.BaseMutationOptions<
  RegisterMutation,
  RegisterMutationVariables
>;
export const MeDocument = gql`
  query Me {
    me {
      id
      email
      createdAt
      updatedAt
    }
  }
`;

/**
 * __useMeQuery__
 *
 * To run a query within a React component, call `useMeQuery` and pass it any options that fit your needs.
 * When your component renders, `useMeQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useMeQuery({
 *   variables: {
 *   },
 * });
 */
export function useMeQuery(
  baseOptions?: Apollo.QueryHookOptions<MeQuery, MeQueryVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<MeQuery, MeQueryVariables>(MeDocument, options);
}
export function useMeLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<MeQuery, MeQueryVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<MeQuery, MeQueryVariables>(MeDocument, options);
}
export function useMeSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<MeQuery, MeQueryVariables>,
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<MeQuery, MeQueryVariables>(
    MeDocument,
    options,
  );
}
export type MeQueryHookResult = ReturnType<typeof useMeQuery>;
export type MeLazyQueryHookResult = ReturnType<typeof useMeLazyQuery>;
export type MeSuspenseQueryHookResult = ReturnType<typeof useMeSuspenseQuery>;
export type MeQueryResult = Apollo.QueryResult<MeQuery, MeQueryVariables>;
export const GetBrokerageAccountsDocument = gql`
  query GetBrokerageAccounts {
    brokerageAccounts {
      id
      name
      brokerId
      syncMode
      broker {
        id
        name
        code
        isActive
      }
      description
      isActive
      createdAt
      updatedAt
    }
  }
`;

/**
 * __useGetBrokerageAccountsQuery__
 *
 * To run a query within a React component, call `useGetBrokerageAccountsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetBrokerageAccountsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetBrokerageAccountsQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetBrokerageAccountsQuery(
  baseOptions?: Apollo.QueryHookOptions<
    GetBrokerageAccountsQuery,
    GetBrokerageAccountsQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    GetBrokerageAccountsQuery,
    GetBrokerageAccountsQueryVariables
  >(GetBrokerageAccountsDocument, options);
}
export function useGetBrokerageAccountsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    GetBrokerageAccountsQuery,
    GetBrokerageAccountsQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    GetBrokerageAccountsQuery,
    GetBrokerageAccountsQueryVariables
  >(GetBrokerageAccountsDocument, options);
}
export function useGetBrokerageAccountsSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        GetBrokerageAccountsQuery,
        GetBrokerageAccountsQueryVariables
      >,
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    GetBrokerageAccountsQuery,
    GetBrokerageAccountsQueryVariables
  >(GetBrokerageAccountsDocument, options);
}
export type GetBrokerageAccountsQueryHookResult = ReturnType<
  typeof useGetBrokerageAccountsQuery
>;
export type GetBrokerageAccountsLazyQueryHookResult = ReturnType<
  typeof useGetBrokerageAccountsLazyQuery
>;
export type GetBrokerageAccountsSuspenseQueryHookResult = ReturnType<
  typeof useGetBrokerageAccountsSuspenseQuery
>;
export type GetBrokerageAccountsQueryResult = Apollo.QueryResult<
  GetBrokerageAccountsQuery,
  GetBrokerageAccountsQueryVariables
>;
export const GetBrokersDocument = gql`
  query GetBrokers {
    brokers {
      id
      code
      name
      description
      apiBaseUrl
      isActive
    }
  }
`;

/**
 * __useGetBrokersQuery__
 *
 * To run a query within a React component, call `useGetBrokersQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetBrokersQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetBrokersQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetBrokersQuery(
  baseOptions?: Apollo.QueryHookOptions<
    GetBrokersQuery,
    GetBrokersQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<GetBrokersQuery, GetBrokersQueryVariables>(
    GetBrokersDocument,
    options,
  );
}
export function useGetBrokersLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    GetBrokersQuery,
    GetBrokersQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<GetBrokersQuery, GetBrokersQueryVariables>(
    GetBrokersDocument,
    options,
  );
}
export function useGetBrokersSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        GetBrokersQuery,
        GetBrokersQueryVariables
      >,
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<GetBrokersQuery, GetBrokersQueryVariables>(
    GetBrokersDocument,
    options,
  );
}
export type GetBrokersQueryHookResult = ReturnType<typeof useGetBrokersQuery>;
export type GetBrokersLazyQueryHookResult = ReturnType<
  typeof useGetBrokersLazyQuery
>;
export type GetBrokersSuspenseQueryHookResult = ReturnType<
  typeof useGetBrokersSuspenseQuery
>;
export type GetBrokersQueryResult = Apollo.QueryResult<
  GetBrokersQuery,
  GetBrokersQueryVariables
>;
export const GetBrokerageHoldingsDocument = gql`
  query GetBrokerageHoldings($accountId: String) {
    brokerageHoldings(accountId: $accountId) {
      id
      symbol
      name
      quantity
      currentPrice
      marketValue
      currency
      accountId
      lastUpdated
    }
  }
`;

/**
 * __useGetBrokerageHoldingsQuery__
 *
 * To run a query within a React component, call `useGetBrokerageHoldingsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetBrokerageHoldingsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetBrokerageHoldingsQuery({
 *   variables: {
 *      accountId: // value for 'accountId'
 *   },
 * });
 */
export function useGetBrokerageHoldingsQuery(
  baseOptions?: Apollo.QueryHookOptions<
    GetBrokerageHoldingsQuery,
    GetBrokerageHoldingsQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    GetBrokerageHoldingsQuery,
    GetBrokerageHoldingsQueryVariables
  >(GetBrokerageHoldingsDocument, options);
}
export function useGetBrokerageHoldingsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    GetBrokerageHoldingsQuery,
    GetBrokerageHoldingsQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    GetBrokerageHoldingsQuery,
    GetBrokerageHoldingsQueryVariables
  >(GetBrokerageHoldingsDocument, options);
}
export function useGetBrokerageHoldingsSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        GetBrokerageHoldingsQuery,
        GetBrokerageHoldingsQueryVariables
      >,
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    GetBrokerageHoldingsQuery,
    GetBrokerageHoldingsQueryVariables
  >(GetBrokerageHoldingsDocument, options);
}
export type GetBrokerageHoldingsQueryHookResult = ReturnType<
  typeof useGetBrokerageHoldingsQuery
>;
export type GetBrokerageHoldingsLazyQueryHookResult = ReturnType<
  typeof useGetBrokerageHoldingsLazyQuery
>;
export type GetBrokerageHoldingsSuspenseQueryHookResult = ReturnType<
  typeof useGetBrokerageHoldingsSuspenseQuery
>;
export type GetBrokerageHoldingsQueryResult = Apollo.QueryResult<
  GetBrokerageHoldingsQuery,
  GetBrokerageHoldingsQueryVariables
>;
export const CreateBrokerageAccountDocument = gql`
  mutation CreateBrokerageAccount($input: CreateBrokerageAccountInput!) {
    createBrokerageAccount(input: $input) {
      id
      name
      syncMode
      broker {
        id
        name
        code
      }
      description
      isActive
      createdAt
      updatedAt
    }
  }
`;
export type CreateBrokerageAccountMutationFn = Apollo.MutationFunction<
  CreateBrokerageAccountMutation,
  CreateBrokerageAccountMutationVariables
>;

/**
 * __useCreateBrokerageAccountMutation__
 *
 * To run a mutation, you first call `useCreateBrokerageAccountMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateBrokerageAccountMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createBrokerageAccountMutation, { data, loading, error }] = useCreateBrokerageAccountMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateBrokerageAccountMutation(
  baseOptions?: Apollo.MutationHookOptions<
    CreateBrokerageAccountMutation,
    CreateBrokerageAccountMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    CreateBrokerageAccountMutation,
    CreateBrokerageAccountMutationVariables
  >(CreateBrokerageAccountDocument, options);
}
export type CreateBrokerageAccountMutationHookResult = ReturnType<
  typeof useCreateBrokerageAccountMutation
>;
export type CreateBrokerageAccountMutationResult =
  Apollo.MutationResult<CreateBrokerageAccountMutation>;
export type CreateBrokerageAccountMutationOptions = Apollo.BaseMutationOptions<
  CreateBrokerageAccountMutation,
  CreateBrokerageAccountMutationVariables
>;
export const UpdateBrokerageAccountDocument = gql`
  mutation UpdateBrokerageAccount($input: UpdateBrokerageAccountInput!) {
    updateBrokerageAccount(input: $input) {
      id
      name
      syncMode
      broker {
        id
        name
        code
      }
      description
      isActive
      createdAt
      updatedAt
    }
  }
`;
export type UpdateBrokerageAccountMutationFn = Apollo.MutationFunction<
  UpdateBrokerageAccountMutation,
  UpdateBrokerageAccountMutationVariables
>;

/**
 * __useUpdateBrokerageAccountMutation__
 *
 * To run a mutation, you first call `useUpdateBrokerageAccountMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateBrokerageAccountMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateBrokerageAccountMutation, { data, loading, error }] = useUpdateBrokerageAccountMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateBrokerageAccountMutation(
  baseOptions?: Apollo.MutationHookOptions<
    UpdateBrokerageAccountMutation,
    UpdateBrokerageAccountMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    UpdateBrokerageAccountMutation,
    UpdateBrokerageAccountMutationVariables
  >(UpdateBrokerageAccountDocument, options);
}
export type UpdateBrokerageAccountMutationHookResult = ReturnType<
  typeof useUpdateBrokerageAccountMutation
>;
export type UpdateBrokerageAccountMutationResult =
  Apollo.MutationResult<UpdateBrokerageAccountMutation>;
export type UpdateBrokerageAccountMutationOptions = Apollo.BaseMutationOptions<
  UpdateBrokerageAccountMutation,
  UpdateBrokerageAccountMutationVariables
>;
export const CreateBrokerDocument = gql`
  mutation CreateBroker($input: CreateBrokerInput!) {
    createBroker(input: $input) {
      id
      code
      name
      description
      apiBaseUrl
      isActive
      createdAt
      updatedAt
    }
  }
`;
export type CreateBrokerMutationFn = Apollo.MutationFunction<
  CreateBrokerMutation,
  CreateBrokerMutationVariables
>;

/**
 * __useCreateBrokerMutation__
 *
 * To run a mutation, you first call `useCreateBrokerMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateBrokerMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createBrokerMutation, { data, loading, error }] = useCreateBrokerMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateBrokerMutation(
  baseOptions?: Apollo.MutationHookOptions<
    CreateBrokerMutation,
    CreateBrokerMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    CreateBrokerMutation,
    CreateBrokerMutationVariables
  >(CreateBrokerDocument, options);
}
export type CreateBrokerMutationHookResult = ReturnType<
  typeof useCreateBrokerMutation
>;
export type CreateBrokerMutationResult =
  Apollo.MutationResult<CreateBrokerMutation>;
export type CreateBrokerMutationOptions = Apollo.BaseMutationOptions<
  CreateBrokerMutation,
  CreateBrokerMutationVariables
>;
export const UpdateBrokerDocument = gql`
  mutation UpdateBroker($input: UpdateBrokerInput!) {
    updateBroker(input: $input) {
      id
      code
      name
      description
      apiBaseUrl
      isActive
      createdAt
      updatedAt
    }
  }
`;
export type UpdateBrokerMutationFn = Apollo.MutationFunction<
  UpdateBrokerMutation,
  UpdateBrokerMutationVariables
>;

/**
 * __useUpdateBrokerMutation__
 *
 * To run a mutation, you first call `useUpdateBrokerMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateBrokerMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateBrokerMutation, { data, loading, error }] = useUpdateBrokerMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateBrokerMutation(
  baseOptions?: Apollo.MutationHookOptions<
    UpdateBrokerMutation,
    UpdateBrokerMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    UpdateBrokerMutation,
    UpdateBrokerMutationVariables
  >(UpdateBrokerDocument, options);
}
export type UpdateBrokerMutationHookResult = ReturnType<
  typeof useUpdateBrokerMutation
>;
export type UpdateBrokerMutationResult =
  Apollo.MutationResult<UpdateBrokerMutation>;
export type UpdateBrokerMutationOptions = Apollo.BaseMutationOptions<
  UpdateBrokerMutation,
  UpdateBrokerMutationVariables
>;
export const DeleteBrokerDocument = gql`
  mutation DeleteBroker($id: String!) {
    deleteBroker(id: $id)
  }
`;
export type DeleteBrokerMutationFn = Apollo.MutationFunction<
  DeleteBrokerMutation,
  DeleteBrokerMutationVariables
>;

/**
 * __useDeleteBrokerMutation__
 *
 * To run a mutation, you first call `useDeleteBrokerMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteBrokerMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteBrokerMutation, { data, loading, error }] = useDeleteBrokerMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteBrokerMutation(
  baseOptions?: Apollo.MutationHookOptions<
    DeleteBrokerMutation,
    DeleteBrokerMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    DeleteBrokerMutation,
    DeleteBrokerMutationVariables
  >(DeleteBrokerDocument, options);
}
export type DeleteBrokerMutationHookResult = ReturnType<
  typeof useDeleteBrokerMutation
>;
export type DeleteBrokerMutationResult =
  Apollo.MutationResult<DeleteBrokerMutation>;
export type DeleteBrokerMutationOptions = Apollo.BaseMutationOptions<
  DeleteBrokerMutation,
  DeleteBrokerMutationVariables
>;
export const DeleteBrokerageAccountDocument = gql`
  mutation DeleteBrokerageAccount($id: String!) {
    deleteBrokerageAccount(id: $id)
  }
`;
export type DeleteBrokerageAccountMutationFn = Apollo.MutationFunction<
  DeleteBrokerageAccountMutation,
  DeleteBrokerageAccountMutationVariables
>;

/**
 * __useDeleteBrokerageAccountMutation__
 *
 * To run a mutation, you first call `useDeleteBrokerageAccountMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteBrokerageAccountMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteBrokerageAccountMutation, { data, loading, error }] = useDeleteBrokerageAccountMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteBrokerageAccountMutation(
  baseOptions?: Apollo.MutationHookOptions<
    DeleteBrokerageAccountMutation,
    DeleteBrokerageAccountMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    DeleteBrokerageAccountMutation,
    DeleteBrokerageAccountMutationVariables
  >(DeleteBrokerageAccountDocument, options);
}
export type DeleteBrokerageAccountMutationHookResult = ReturnType<
  typeof useDeleteBrokerageAccountMutation
>;
export type DeleteBrokerageAccountMutationResult =
  Apollo.MutationResult<DeleteBrokerageAccountMutation>;
export type DeleteBrokerageAccountMutationOptions = Apollo.BaseMutationOptions<
  DeleteBrokerageAccountMutation,
  DeleteBrokerageAccountMutationVariables
>;
export const RefreshBrokerageHoldingsDocument = gql`
  mutation RefreshBrokerageHoldings($accountId: String!) {
    refreshBrokerageHoldings(accountId: $accountId) {
      id
      symbol
      name
      quantity
      currentPrice
      marketValue
      currency
      accountId
      lastUpdated
    }
  }
`;
export type RefreshBrokerageHoldingsMutationFn = Apollo.MutationFunction<
  RefreshBrokerageHoldingsMutation,
  RefreshBrokerageHoldingsMutationVariables
>;

/**
 * __useRefreshBrokerageHoldingsMutation__
 *
 * To run a mutation, you first call `useRefreshBrokerageHoldingsMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRefreshBrokerageHoldingsMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [refreshBrokerageHoldingsMutation, { data, loading, error }] = useRefreshBrokerageHoldingsMutation({
 *   variables: {
 *      accountId: // value for 'accountId'
 *   },
 * });
 */
export function useRefreshBrokerageHoldingsMutation(
  baseOptions?: Apollo.MutationHookOptions<
    RefreshBrokerageHoldingsMutation,
    RefreshBrokerageHoldingsMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    RefreshBrokerageHoldingsMutation,
    RefreshBrokerageHoldingsMutationVariables
  >(RefreshBrokerageHoldingsDocument, options);
}
export type RefreshBrokerageHoldingsMutationHookResult = ReturnType<
  typeof useRefreshBrokerageHoldingsMutation
>;
export type RefreshBrokerageHoldingsMutationResult =
  Apollo.MutationResult<RefreshBrokerageHoldingsMutation>;
export type RefreshBrokerageHoldingsMutationOptions =
  Apollo.BaseMutationOptions<
    RefreshBrokerageHoldingsMutation,
    RefreshBrokerageHoldingsMutationVariables
  >;
export const GetHoldingTagsDocument = gql`
  query GetHoldingTags($holdingSymbol: String) {
    holdingTags(holdingSymbol: $holdingSymbol) {
      id
      holdingSymbol
      tagId
      createdAt
    }
  }
`;

/**
 * __useGetHoldingTagsQuery__
 *
 * To run a query within a React component, call `useGetHoldingTagsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetHoldingTagsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetHoldingTagsQuery({
 *   variables: {
 *      holdingSymbol: // value for 'holdingSymbol'
 *   },
 * });
 */
export function useGetHoldingTagsQuery(
  baseOptions?: Apollo.QueryHookOptions<
    GetHoldingTagsQuery,
    GetHoldingTagsQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<GetHoldingTagsQuery, GetHoldingTagsQueryVariables>(
    GetHoldingTagsDocument,
    options,
  );
}
export function useGetHoldingTagsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    GetHoldingTagsQuery,
    GetHoldingTagsQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<GetHoldingTagsQuery, GetHoldingTagsQueryVariables>(
    GetHoldingTagsDocument,
    options,
  );
}
export function useGetHoldingTagsSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        GetHoldingTagsQuery,
        GetHoldingTagsQueryVariables
      >,
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    GetHoldingTagsQuery,
    GetHoldingTagsQueryVariables
  >(GetHoldingTagsDocument, options);
}
export type GetHoldingTagsQueryHookResult = ReturnType<
  typeof useGetHoldingTagsQuery
>;
export type GetHoldingTagsLazyQueryHookResult = ReturnType<
  typeof useGetHoldingTagsLazyQuery
>;
export type GetHoldingTagsSuspenseQueryHookResult = ReturnType<
  typeof useGetHoldingTagsSuspenseQuery
>;
export type GetHoldingTagsQueryResult = Apollo.QueryResult<
  GetHoldingTagsQuery,
  GetHoldingTagsQueryVariables
>;
export const GetTagsForHoldingDocument = gql`
  query GetTagsForHolding($holdingSymbol: String!) {
    tagsForHolding(holdingSymbol: $holdingSymbol)
  }
`;

/**
 * __useGetTagsForHoldingQuery__
 *
 * To run a query within a React component, call `useGetTagsForHoldingQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetTagsForHoldingQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetTagsForHoldingQuery({
 *   variables: {
 *      holdingSymbol: // value for 'holdingSymbol'
 *   },
 * });
 */
export function useGetTagsForHoldingQuery(
  baseOptions: Apollo.QueryHookOptions<
    GetTagsForHoldingQuery,
    GetTagsForHoldingQueryVariables
  > &
    (
      | { variables: GetTagsForHoldingQueryVariables; skip?: boolean }
      | { skip: boolean }
    ),
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    GetTagsForHoldingQuery,
    GetTagsForHoldingQueryVariables
  >(GetTagsForHoldingDocument, options);
}
export function useGetTagsForHoldingLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    GetTagsForHoldingQuery,
    GetTagsForHoldingQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    GetTagsForHoldingQuery,
    GetTagsForHoldingQueryVariables
  >(GetTagsForHoldingDocument, options);
}
export function useGetTagsForHoldingSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        GetTagsForHoldingQuery,
        GetTagsForHoldingQueryVariables
      >,
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    GetTagsForHoldingQuery,
    GetTagsForHoldingQueryVariables
  >(GetTagsForHoldingDocument, options);
}
export type GetTagsForHoldingQueryHookResult = ReturnType<
  typeof useGetTagsForHoldingQuery
>;
export type GetTagsForHoldingLazyQueryHookResult = ReturnType<
  typeof useGetTagsForHoldingLazyQuery
>;
export type GetTagsForHoldingSuspenseQueryHookResult = ReturnType<
  typeof useGetTagsForHoldingSuspenseQuery
>;
export type GetTagsForHoldingQueryResult = Apollo.QueryResult<
  GetTagsForHoldingQuery,
  GetTagsForHoldingQueryVariables
>;
export const GetHoldingsForTagDocument = gql`
  query GetHoldingsForTag($tagId: String!) {
    holdingsForTag(tagId: $tagId)
  }
`;

/**
 * __useGetHoldingsForTagQuery__
 *
 * To run a query within a React component, call `useGetHoldingsForTagQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetHoldingsForTagQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetHoldingsForTagQuery({
 *   variables: {
 *      tagId: // value for 'tagId'
 *   },
 * });
 */
export function useGetHoldingsForTagQuery(
  baseOptions: Apollo.QueryHookOptions<
    GetHoldingsForTagQuery,
    GetHoldingsForTagQueryVariables
  > &
    (
      | { variables: GetHoldingsForTagQueryVariables; skip?: boolean }
      | { skip: boolean }
    ),
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    GetHoldingsForTagQuery,
    GetHoldingsForTagQueryVariables
  >(GetHoldingsForTagDocument, options);
}
export function useGetHoldingsForTagLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    GetHoldingsForTagQuery,
    GetHoldingsForTagQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    GetHoldingsForTagQuery,
    GetHoldingsForTagQueryVariables
  >(GetHoldingsForTagDocument, options);
}
export function useGetHoldingsForTagSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        GetHoldingsForTagQuery,
        GetHoldingsForTagQueryVariables
      >,
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    GetHoldingsForTagQuery,
    GetHoldingsForTagQueryVariables
  >(GetHoldingsForTagDocument, options);
}
export type GetHoldingsForTagQueryHookResult = ReturnType<
  typeof useGetHoldingsForTagQuery
>;
export type GetHoldingsForTagLazyQueryHookResult = ReturnType<
  typeof useGetHoldingsForTagLazyQuery
>;
export type GetHoldingsForTagSuspenseQueryHookResult = ReturnType<
  typeof useGetHoldingsForTagSuspenseQuery
>;
export type GetHoldingsForTagQueryResult = Apollo.QueryResult<
  GetHoldingsForTagQuery,
  GetHoldingsForTagQueryVariables
>;
export const AddHoldingTagDocument = gql`
  mutation AddHoldingTag($input: AddHoldingTagInput!) {
    addHoldingTag(input: $input) {
      id
      holdingSymbol
      tagId
      createdAt
    }
  }
`;
export type AddHoldingTagMutationFn = Apollo.MutationFunction<
  AddHoldingTagMutation,
  AddHoldingTagMutationVariables
>;

/**
 * __useAddHoldingTagMutation__
 *
 * To run a mutation, you first call `useAddHoldingTagMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useAddHoldingTagMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [addHoldingTagMutation, { data, loading, error }] = useAddHoldingTagMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useAddHoldingTagMutation(
  baseOptions?: Apollo.MutationHookOptions<
    AddHoldingTagMutation,
    AddHoldingTagMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    AddHoldingTagMutation,
    AddHoldingTagMutationVariables
  >(AddHoldingTagDocument, options);
}
export type AddHoldingTagMutationHookResult = ReturnType<
  typeof useAddHoldingTagMutation
>;
export type AddHoldingTagMutationResult =
  Apollo.MutationResult<AddHoldingTagMutation>;
export type AddHoldingTagMutationOptions = Apollo.BaseMutationOptions<
  AddHoldingTagMutation,
  AddHoldingTagMutationVariables
>;
export const RemoveHoldingTagDocument = gql`
  mutation RemoveHoldingTag($input: RemoveHoldingTagInput!) {
    removeHoldingTag(input: $input)
  }
`;
export type RemoveHoldingTagMutationFn = Apollo.MutationFunction<
  RemoveHoldingTagMutation,
  RemoveHoldingTagMutationVariables
>;

/**
 * __useRemoveHoldingTagMutation__
 *
 * To run a mutation, you first call `useRemoveHoldingTagMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRemoveHoldingTagMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [removeHoldingTagMutation, { data, loading, error }] = useRemoveHoldingTagMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useRemoveHoldingTagMutation(
  baseOptions?: Apollo.MutationHookOptions<
    RemoveHoldingTagMutation,
    RemoveHoldingTagMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    RemoveHoldingTagMutation,
    RemoveHoldingTagMutationVariables
  >(RemoveHoldingTagDocument, options);
}
export type RemoveHoldingTagMutationHookResult = ReturnType<
  typeof useRemoveHoldingTagMutation
>;
export type RemoveHoldingTagMutationResult =
  Apollo.MutationResult<RemoveHoldingTagMutation>;
export type RemoveHoldingTagMutationOptions = Apollo.BaseMutationOptions<
  RemoveHoldingTagMutation,
  RemoveHoldingTagMutationVariables
>;
export const SetHoldingTagsDocument = gql`
  mutation SetHoldingTags($input: SetHoldingTagsInput!) {
    setHoldingTags(input: $input) {
      id
      holdingSymbol
      tagId
      createdAt
    }
  }
`;
export type SetHoldingTagsMutationFn = Apollo.MutationFunction<
  SetHoldingTagsMutation,
  SetHoldingTagsMutationVariables
>;

/**
 * __useSetHoldingTagsMutation__
 *
 * To run a mutation, you first call `useSetHoldingTagsMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSetHoldingTagsMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [setHoldingTagsMutation, { data, loading, error }] = useSetHoldingTagsMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useSetHoldingTagsMutation(
  baseOptions?: Apollo.MutationHookOptions<
    SetHoldingTagsMutation,
    SetHoldingTagsMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    SetHoldingTagsMutation,
    SetHoldingTagsMutationVariables
  >(SetHoldingTagsDocument, options);
}
export type SetHoldingTagsMutationHookResult = ReturnType<
  typeof useSetHoldingTagsMutation
>;
export type SetHoldingTagsMutationResult =
  Apollo.MutationResult<SetHoldingTagsMutation>;
export type SetHoldingTagsMutationOptions = Apollo.BaseMutationOptions<
  SetHoldingTagsMutation,
  SetHoldingTagsMutationVariables
>;
export const GetHoldingsDocument = gql`
  query GetHoldings($source: HoldingSource, $accountId: String) {
    holdings(source: $source, accountId: $accountId) {
      id
      source
      accountId
      market
      symbol
      name
      quantity
      currentPrice
      marketValue
      currency
      lastUpdated
      createdAt
      updatedAt
    }
  }
`;

/**
 * __useGetHoldingsQuery__
 *
 * To run a query within a React component, call `useGetHoldingsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetHoldingsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetHoldingsQuery({
 *   variables: {
 *      source: // value for 'source'
 *      accountId: // value for 'accountId'
 *   },
 * });
 */
export function useGetHoldingsQuery(
  baseOptions?: Apollo.QueryHookOptions<
    GetHoldingsQuery,
    GetHoldingsQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<GetHoldingsQuery, GetHoldingsQueryVariables>(
    GetHoldingsDocument,
    options,
  );
}
export function useGetHoldingsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    GetHoldingsQuery,
    GetHoldingsQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<GetHoldingsQuery, GetHoldingsQueryVariables>(
    GetHoldingsDocument,
    options,
  );
}
export function useGetHoldingsSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        GetHoldingsQuery,
        GetHoldingsQueryVariables
      >,
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<GetHoldingsQuery, GetHoldingsQueryVariables>(
    GetHoldingsDocument,
    options,
  );
}
export type GetHoldingsQueryHookResult = ReturnType<typeof useGetHoldingsQuery>;
export type GetHoldingsLazyQueryHookResult = ReturnType<
  typeof useGetHoldingsLazyQuery
>;
export type GetHoldingsSuspenseQueryHookResult = ReturnType<
  typeof useGetHoldingsSuspenseQuery
>;
export type GetHoldingsQueryResult = Apollo.QueryResult<
  GetHoldingsQuery,
  GetHoldingsQueryVariables
>;
export const CreateManualHoldingDocument = gql`
  mutation CreateManualHolding($input: CreateManualHoldingInput!) {
    createManualHolding(input: $input) {
      id
      source
      accountId
      market
      symbol
      name
      quantity
      currentPrice
      marketValue
      currency
      lastUpdated
      createdAt
      updatedAt
    }
  }
`;
export type CreateManualHoldingMutationFn = Apollo.MutationFunction<
  CreateManualHoldingMutation,
  CreateManualHoldingMutationVariables
>;

/**
 * __useCreateManualHoldingMutation__
 *
 * To run a mutation, you first call `useCreateManualHoldingMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateManualHoldingMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createManualHoldingMutation, { data, loading, error }] = useCreateManualHoldingMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateManualHoldingMutation(
  baseOptions?: Apollo.MutationHookOptions<
    CreateManualHoldingMutation,
    CreateManualHoldingMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    CreateManualHoldingMutation,
    CreateManualHoldingMutationVariables
  >(CreateManualHoldingDocument, options);
}
export type CreateManualHoldingMutationHookResult = ReturnType<
  typeof useCreateManualHoldingMutation
>;
export type CreateManualHoldingMutationResult =
  Apollo.MutationResult<CreateManualHoldingMutation>;
export type CreateManualHoldingMutationOptions = Apollo.BaseMutationOptions<
  CreateManualHoldingMutation,
  CreateManualHoldingMutationVariables
>;
export const IncreaseManualHoldingDocument = gql`
  mutation IncreaseManualHolding($input: IncreaseManualHoldingInput!) {
    increaseManualHolding(input: $input) {
      id
      source
      accountId
      market
      symbol
      name
      quantity
      currentPrice
      marketValue
      currency
      lastUpdated
      createdAt
      updatedAt
    }
  }
`;
export type IncreaseManualHoldingMutationFn = Apollo.MutationFunction<
  IncreaseManualHoldingMutation,
  IncreaseManualHoldingMutationVariables
>;

/**
 * __useIncreaseManualHoldingMutation__
 *
 * To run a mutation, you first call `useIncreaseManualHoldingMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useIncreaseManualHoldingMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [increaseManualHoldingMutation, { data, loading, error }] = useIncreaseManualHoldingMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useIncreaseManualHoldingMutation(
  baseOptions?: Apollo.MutationHookOptions<
    IncreaseManualHoldingMutation,
    IncreaseManualHoldingMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    IncreaseManualHoldingMutation,
    IncreaseManualHoldingMutationVariables
  >(IncreaseManualHoldingDocument, options);
}
export type IncreaseManualHoldingMutationHookResult = ReturnType<
  typeof useIncreaseManualHoldingMutation
>;
export type IncreaseManualHoldingMutationResult =
  Apollo.MutationResult<IncreaseManualHoldingMutation>;
export type IncreaseManualHoldingMutationOptions = Apollo.BaseMutationOptions<
  IncreaseManualHoldingMutation,
  IncreaseManualHoldingMutationVariables
>;
export const SetManualHoldingQuantityDocument = gql`
  mutation SetManualHoldingQuantity($input: SetManualHoldingQuantityInput!) {
    setManualHoldingQuantity(input: $input) {
      id
      source
      accountId
      market
      symbol
      name
      quantity
      currentPrice
      marketValue
      currency
      lastUpdated
      createdAt
      updatedAt
    }
  }
`;
export type SetManualHoldingQuantityMutationFn = Apollo.MutationFunction<
  SetManualHoldingQuantityMutation,
  SetManualHoldingQuantityMutationVariables
>;

/**
 * __useSetManualHoldingQuantityMutation__
 *
 * To run a mutation, you first call `useSetManualHoldingQuantityMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSetManualHoldingQuantityMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [setManualHoldingQuantityMutation, { data, loading, error }] = useSetManualHoldingQuantityMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useSetManualHoldingQuantityMutation(
  baseOptions?: Apollo.MutationHookOptions<
    SetManualHoldingQuantityMutation,
    SetManualHoldingQuantityMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    SetManualHoldingQuantityMutation,
    SetManualHoldingQuantityMutationVariables
  >(SetManualHoldingQuantityDocument, options);
}
export type SetManualHoldingQuantityMutationHookResult = ReturnType<
  typeof useSetManualHoldingQuantityMutation
>;
export type SetManualHoldingQuantityMutationResult =
  Apollo.MutationResult<SetManualHoldingQuantityMutation>;
export type SetManualHoldingQuantityMutationOptions =
  Apollo.BaseMutationOptions<
    SetManualHoldingQuantityMutation,
    SetManualHoldingQuantityMutationVariables
  >;
export const DeleteManualHoldingDocument = gql`
  mutation DeleteManualHolding($input: ManualHoldingIdentifierInput!) {
    deleteManualHolding(input: $input)
  }
`;
export type DeleteManualHoldingMutationFn = Apollo.MutationFunction<
  DeleteManualHoldingMutation,
  DeleteManualHoldingMutationVariables
>;

/**
 * __useDeleteManualHoldingMutation__
 *
 * To run a mutation, you first call `useDeleteManualHoldingMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteManualHoldingMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteManualHoldingMutation, { data, loading, error }] = useDeleteManualHoldingMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useDeleteManualHoldingMutation(
  baseOptions?: Apollo.MutationHookOptions<
    DeleteManualHoldingMutation,
    DeleteManualHoldingMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    DeleteManualHoldingMutation,
    DeleteManualHoldingMutationVariables
  >(DeleteManualHoldingDocument, options);
}
export type DeleteManualHoldingMutationHookResult = ReturnType<
  typeof useDeleteManualHoldingMutation
>;
export type DeleteManualHoldingMutationResult =
  Apollo.MutationResult<DeleteManualHoldingMutation>;
export type DeleteManualHoldingMutationOptions = Apollo.BaseMutationOptions<
  DeleteManualHoldingMutation,
  DeleteManualHoldingMutationVariables
>;
export const SyncManualHoldingPriceDocument = gql`
  mutation SyncManualHoldingPrice($input: ManualHoldingIdentifierInput!) {
    syncManualHoldingPrice(input: $input) {
      id
      source
      accountId
      market
      symbol
      name
      currentPrice
      marketValue
      lastUpdated
      quantity
      currency
      createdAt
      updatedAt
    }
  }
`;
export type SyncManualHoldingPriceMutationFn = Apollo.MutationFunction<
  SyncManualHoldingPriceMutation,
  SyncManualHoldingPriceMutationVariables
>;

/**
 * __useSyncManualHoldingPriceMutation__
 *
 * To run a mutation, you first call `useSyncManualHoldingPriceMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSyncManualHoldingPriceMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [syncManualHoldingPriceMutation, { data, loading, error }] = useSyncManualHoldingPriceMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useSyncManualHoldingPriceMutation(
  baseOptions?: Apollo.MutationHookOptions<
    SyncManualHoldingPriceMutation,
    SyncManualHoldingPriceMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    SyncManualHoldingPriceMutation,
    SyncManualHoldingPriceMutationVariables
  >(SyncManualHoldingPriceDocument, options);
}
export type SyncManualHoldingPriceMutationHookResult = ReturnType<
  typeof useSyncManualHoldingPriceMutation
>;
export type SyncManualHoldingPriceMutationResult =
  Apollo.MutationResult<SyncManualHoldingPriceMutation>;
export type SyncManualHoldingPriceMutationOptions = Apollo.BaseMutationOptions<
  SyncManualHoldingPriceMutation,
  SyncManualHoldingPriceMutationVariables
>;
export const GetMarketsDocument = gql`
  query GetMarkets {
    markets {
      id
      code
      displayName
      yahooSuffix
    }
  }
`;

/**
 * __useGetMarketsQuery__
 *
 * To run a query within a React component, call `useGetMarketsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetMarketsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetMarketsQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetMarketsQuery(
  baseOptions?: Apollo.QueryHookOptions<
    GetMarketsQuery,
    GetMarketsQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<GetMarketsQuery, GetMarketsQueryVariables>(
    GetMarketsDocument,
    options,
  );
}
export function useGetMarketsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    GetMarketsQuery,
    GetMarketsQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<GetMarketsQuery, GetMarketsQueryVariables>(
    GetMarketsDocument,
    options,
  );
}
export function useGetMarketsSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        GetMarketsQuery,
        GetMarketsQueryVariables
      >,
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<GetMarketsQuery, GetMarketsQueryVariables>(
    GetMarketsDocument,
    options,
  );
}
export type GetMarketsQueryHookResult = ReturnType<typeof useGetMarketsQuery>;
export type GetMarketsLazyQueryHookResult = ReturnType<
  typeof useGetMarketsLazyQuery
>;
export type GetMarketsSuspenseQueryHookResult = ReturnType<
  typeof useGetMarketsSuspenseQuery
>;
export type GetMarketsQueryResult = Apollo.QueryResult<
  GetMarketsQuery,
  GetMarketsQueryVariables
>;
export const GetRebalancingGroupsDocument = gql`
  query GetRebalancingGroups {
    rebalancingGroups {
      id
      name
      description
      tagIds
      createdAt
      updatedAt
    }
  }
`;

/**
 * __useGetRebalancingGroupsQuery__
 *
 * To run a query within a React component, call `useGetRebalancingGroupsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetRebalancingGroupsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetRebalancingGroupsQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetRebalancingGroupsQuery(
  baseOptions?: Apollo.QueryHookOptions<
    GetRebalancingGroupsQuery,
    GetRebalancingGroupsQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    GetRebalancingGroupsQuery,
    GetRebalancingGroupsQueryVariables
  >(GetRebalancingGroupsDocument, options);
}
export function useGetRebalancingGroupsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    GetRebalancingGroupsQuery,
    GetRebalancingGroupsQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    GetRebalancingGroupsQuery,
    GetRebalancingGroupsQueryVariables
  >(GetRebalancingGroupsDocument, options);
}
export function useGetRebalancingGroupsSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        GetRebalancingGroupsQuery,
        GetRebalancingGroupsQueryVariables
      >,
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    GetRebalancingGroupsQuery,
    GetRebalancingGroupsQueryVariables
  >(GetRebalancingGroupsDocument, options);
}
export type GetRebalancingGroupsQueryHookResult = ReturnType<
  typeof useGetRebalancingGroupsQuery
>;
export type GetRebalancingGroupsLazyQueryHookResult = ReturnType<
  typeof useGetRebalancingGroupsLazyQuery
>;
export type GetRebalancingGroupsSuspenseQueryHookResult = ReturnType<
  typeof useGetRebalancingGroupsSuspenseQuery
>;
export type GetRebalancingGroupsQueryResult = Apollo.QueryResult<
  GetRebalancingGroupsQuery,
  GetRebalancingGroupsQueryVariables
>;
export const GetRebalancingAnalysisDocument = gql`
  query GetRebalancingAnalysis($groupId: String!) {
    rebalancingAnalysis(groupId: $groupId) {
      groupId
      groupName
      totalValue
      baseCurrency
      lastUpdated
      allocations {
        tagId
        tagName
        tagColor
        currentValue
        currentPercentage
        targetPercentage
        difference
      }
    }
  }
`;

/**
 * __useGetRebalancingAnalysisQuery__
 *
 * To run a query within a React component, call `useGetRebalancingAnalysisQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetRebalancingAnalysisQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetRebalancingAnalysisQuery({
 *   variables: {
 *      groupId: // value for 'groupId'
 *   },
 * });
 */
export function useGetRebalancingAnalysisQuery(
  baseOptions: Apollo.QueryHookOptions<
    GetRebalancingAnalysisQuery,
    GetRebalancingAnalysisQueryVariables
  > &
    (
      | { variables: GetRebalancingAnalysisQueryVariables; skip?: boolean }
      | { skip: boolean }
    ),
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    GetRebalancingAnalysisQuery,
    GetRebalancingAnalysisQueryVariables
  >(GetRebalancingAnalysisDocument, options);
}
export function useGetRebalancingAnalysisLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    GetRebalancingAnalysisQuery,
    GetRebalancingAnalysisQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    GetRebalancingAnalysisQuery,
    GetRebalancingAnalysisQueryVariables
  >(GetRebalancingAnalysisDocument, options);
}
export function useGetRebalancingAnalysisSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        GetRebalancingAnalysisQuery,
        GetRebalancingAnalysisQueryVariables
      >,
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    GetRebalancingAnalysisQuery,
    GetRebalancingAnalysisQueryVariables
  >(GetRebalancingAnalysisDocument, options);
}
export type GetRebalancingAnalysisQueryHookResult = ReturnType<
  typeof useGetRebalancingAnalysisQuery
>;
export type GetRebalancingAnalysisLazyQueryHookResult = ReturnType<
  typeof useGetRebalancingAnalysisLazyQuery
>;
export type GetRebalancingAnalysisSuspenseQueryHookResult = ReturnType<
  typeof useGetRebalancingAnalysisSuspenseQuery
>;
export type GetRebalancingAnalysisQueryResult = Apollo.QueryResult<
  GetRebalancingAnalysisQuery,
  GetRebalancingAnalysisQueryVariables
>;
export const GetInvestmentRecommendationDocument = gql`
  query GetInvestmentRecommendation($input: CalculateInvestmentInput!) {
    investmentRecommendation(input: $input) {
      tagId
      tagName
      recommendedAmount
      recommendedPercentage
      suggestedSymbols
      baseCurrency
    }
  }
`;

/**
 * __useGetInvestmentRecommendationQuery__
 *
 * To run a query within a React component, call `useGetInvestmentRecommendationQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetInvestmentRecommendationQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetInvestmentRecommendationQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useGetInvestmentRecommendationQuery(
  baseOptions: Apollo.QueryHookOptions<
    GetInvestmentRecommendationQuery,
    GetInvestmentRecommendationQueryVariables
  > &
    (
      | { variables: GetInvestmentRecommendationQueryVariables; skip?: boolean }
      | { skip: boolean }
    ),
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    GetInvestmentRecommendationQuery,
    GetInvestmentRecommendationQueryVariables
  >(GetInvestmentRecommendationDocument, options);
}
export function useGetInvestmentRecommendationLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    GetInvestmentRecommendationQuery,
    GetInvestmentRecommendationQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    GetInvestmentRecommendationQuery,
    GetInvestmentRecommendationQueryVariables
  >(GetInvestmentRecommendationDocument, options);
}
export function useGetInvestmentRecommendationSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        GetInvestmentRecommendationQuery,
        GetInvestmentRecommendationQueryVariables
      >,
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    GetInvestmentRecommendationQuery,
    GetInvestmentRecommendationQueryVariables
  >(GetInvestmentRecommendationDocument, options);
}
export type GetInvestmentRecommendationQueryHookResult = ReturnType<
  typeof useGetInvestmentRecommendationQuery
>;
export type GetInvestmentRecommendationLazyQueryHookResult = ReturnType<
  typeof useGetInvestmentRecommendationLazyQuery
>;
export type GetInvestmentRecommendationSuspenseQueryHookResult = ReturnType<
  typeof useGetInvestmentRecommendationSuspenseQuery
>;
export type GetInvestmentRecommendationQueryResult = Apollo.QueryResult<
  GetInvestmentRecommendationQuery,
  GetInvestmentRecommendationQueryVariables
>;
export const CreateRebalancingGroupDocument = gql`
  mutation CreateRebalancingGroup($input: CreateRebalancingGroupInput!) {
    createRebalancingGroup(input: $input) {
      id
      name
      description
      tagIds
      createdAt
      updatedAt
    }
  }
`;
export type CreateRebalancingGroupMutationFn = Apollo.MutationFunction<
  CreateRebalancingGroupMutation,
  CreateRebalancingGroupMutationVariables
>;

/**
 * __useCreateRebalancingGroupMutation__
 *
 * To run a mutation, you first call `useCreateRebalancingGroupMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateRebalancingGroupMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createRebalancingGroupMutation, { data, loading, error }] = useCreateRebalancingGroupMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateRebalancingGroupMutation(
  baseOptions?: Apollo.MutationHookOptions<
    CreateRebalancingGroupMutation,
    CreateRebalancingGroupMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    CreateRebalancingGroupMutation,
    CreateRebalancingGroupMutationVariables
  >(CreateRebalancingGroupDocument, options);
}
export type CreateRebalancingGroupMutationHookResult = ReturnType<
  typeof useCreateRebalancingGroupMutation
>;
export type CreateRebalancingGroupMutationResult =
  Apollo.MutationResult<CreateRebalancingGroupMutation>;
export type CreateRebalancingGroupMutationOptions = Apollo.BaseMutationOptions<
  CreateRebalancingGroupMutation,
  CreateRebalancingGroupMutationVariables
>;
export const UpdateRebalancingGroupDocument = gql`
  mutation UpdateRebalancingGroup($input: UpdateRebalancingGroupInput!) {
    updateRebalancingGroup(input: $input) {
      id
      name
      description
      tagIds
      createdAt
      updatedAt
    }
  }
`;
export type UpdateRebalancingGroupMutationFn = Apollo.MutationFunction<
  UpdateRebalancingGroupMutation,
  UpdateRebalancingGroupMutationVariables
>;

/**
 * __useUpdateRebalancingGroupMutation__
 *
 * To run a mutation, you first call `useUpdateRebalancingGroupMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateRebalancingGroupMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateRebalancingGroupMutation, { data, loading, error }] = useUpdateRebalancingGroupMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateRebalancingGroupMutation(
  baseOptions?: Apollo.MutationHookOptions<
    UpdateRebalancingGroupMutation,
    UpdateRebalancingGroupMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    UpdateRebalancingGroupMutation,
    UpdateRebalancingGroupMutationVariables
  >(UpdateRebalancingGroupDocument, options);
}
export type UpdateRebalancingGroupMutationHookResult = ReturnType<
  typeof useUpdateRebalancingGroupMutation
>;
export type UpdateRebalancingGroupMutationResult =
  Apollo.MutationResult<UpdateRebalancingGroupMutation>;
export type UpdateRebalancingGroupMutationOptions = Apollo.BaseMutationOptions<
  UpdateRebalancingGroupMutation,
  UpdateRebalancingGroupMutationVariables
>;
export const DeleteRebalancingGroupDocument = gql`
  mutation DeleteRebalancingGroup($id: String!) {
    deleteRebalancingGroup(id: $id)
  }
`;
export type DeleteRebalancingGroupMutationFn = Apollo.MutationFunction<
  DeleteRebalancingGroupMutation,
  DeleteRebalancingGroupMutationVariables
>;

/**
 * __useDeleteRebalancingGroupMutation__
 *
 * To run a mutation, you first call `useDeleteRebalancingGroupMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteRebalancingGroupMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteRebalancingGroupMutation, { data, loading, error }] = useDeleteRebalancingGroupMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteRebalancingGroupMutation(
  baseOptions?: Apollo.MutationHookOptions<
    DeleteRebalancingGroupMutation,
    DeleteRebalancingGroupMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    DeleteRebalancingGroupMutation,
    DeleteRebalancingGroupMutationVariables
  >(DeleteRebalancingGroupDocument, options);
}
export type DeleteRebalancingGroupMutationHookResult = ReturnType<
  typeof useDeleteRebalancingGroupMutation
>;
export type DeleteRebalancingGroupMutationResult =
  Apollo.MutationResult<DeleteRebalancingGroupMutation>;
export type DeleteRebalancingGroupMutationOptions = Apollo.BaseMutationOptions<
  DeleteRebalancingGroupMutation,
  DeleteRebalancingGroupMutationVariables
>;
export const SetTargetAllocationsDocument = gql`
  mutation SetTargetAllocations($input: SetTargetAllocationsInput!) {
    setTargetAllocations(input: $input)
  }
`;
export type SetTargetAllocationsMutationFn = Apollo.MutationFunction<
  SetTargetAllocationsMutation,
  SetTargetAllocationsMutationVariables
>;

/**
 * __useSetTargetAllocationsMutation__
 *
 * To run a mutation, you first call `useSetTargetAllocationsMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSetTargetAllocationsMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [setTargetAllocationsMutation, { data, loading, error }] = useSetTargetAllocationsMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useSetTargetAllocationsMutation(
  baseOptions?: Apollo.MutationHookOptions<
    SetTargetAllocationsMutation,
    SetTargetAllocationsMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    SetTargetAllocationsMutation,
    SetTargetAllocationsMutationVariables
  >(SetTargetAllocationsDocument, options);
}
export type SetTargetAllocationsMutationHookResult = ReturnType<
  typeof useSetTargetAllocationsMutation
>;
export type SetTargetAllocationsMutationResult =
  Apollo.MutationResult<SetTargetAllocationsMutation>;
export type SetTargetAllocationsMutationOptions = Apollo.BaseMutationOptions<
  SetTargetAllocationsMutation,
  SetTargetAllocationsMutationVariables
>;
export const AddTagsToRebalancingGroupDocument = gql`
  mutation AddTagsToRebalancingGroup($input: AddTagsToRebalancingGroupInput!) {
    addTagsToRebalancingGroup(input: $input) {
      id
      name
      description
      tagIds
      createdAt
      updatedAt
    }
  }
`;
export type AddTagsToRebalancingGroupMutationFn = Apollo.MutationFunction<
  AddTagsToRebalancingGroupMutation,
  AddTagsToRebalancingGroupMutationVariables
>;

/**
 * __useAddTagsToRebalancingGroupMutation__
 *
 * To run a mutation, you first call `useAddTagsToRebalancingGroupMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useAddTagsToRebalancingGroupMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [addTagsToRebalancingGroupMutation, { data, loading, error }] = useAddTagsToRebalancingGroupMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useAddTagsToRebalancingGroupMutation(
  baseOptions?: Apollo.MutationHookOptions<
    AddTagsToRebalancingGroupMutation,
    AddTagsToRebalancingGroupMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    AddTagsToRebalancingGroupMutation,
    AddTagsToRebalancingGroupMutationVariables
  >(AddTagsToRebalancingGroupDocument, options);
}
export type AddTagsToRebalancingGroupMutationHookResult = ReturnType<
  typeof useAddTagsToRebalancingGroupMutation
>;
export type AddTagsToRebalancingGroupMutationResult =
  Apollo.MutationResult<AddTagsToRebalancingGroupMutation>;
export type AddTagsToRebalancingGroupMutationOptions =
  Apollo.BaseMutationOptions<
    AddTagsToRebalancingGroupMutation,
    AddTagsToRebalancingGroupMutationVariables
  >;
export const RemoveTagsFromRebalancingGroupDocument = gql`
  mutation RemoveTagsFromRebalancingGroup(
    $input: RemoveTagsFromRebalancingGroupInput!
  ) {
    removeTagsFromRebalancingGroup(input: $input) {
      id
      name
      description
      tagIds
      createdAt
      updatedAt
    }
  }
`;
export type RemoveTagsFromRebalancingGroupMutationFn = Apollo.MutationFunction<
  RemoveTagsFromRebalancingGroupMutation,
  RemoveTagsFromRebalancingGroupMutationVariables
>;

/**
 * __useRemoveTagsFromRebalancingGroupMutation__
 *
 * To run a mutation, you first call `useRemoveTagsFromRebalancingGroupMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRemoveTagsFromRebalancingGroupMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [removeTagsFromRebalancingGroupMutation, { data, loading, error }] = useRemoveTagsFromRebalancingGroupMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useRemoveTagsFromRebalancingGroupMutation(
  baseOptions?: Apollo.MutationHookOptions<
    RemoveTagsFromRebalancingGroupMutation,
    RemoveTagsFromRebalancingGroupMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    RemoveTagsFromRebalancingGroupMutation,
    RemoveTagsFromRebalancingGroupMutationVariables
  >(RemoveTagsFromRebalancingGroupDocument, options);
}
export type RemoveTagsFromRebalancingGroupMutationHookResult = ReturnType<
  typeof useRemoveTagsFromRebalancingGroupMutation
>;
export type RemoveTagsFromRebalancingGroupMutationResult =
  Apollo.MutationResult<RemoveTagsFromRebalancingGroupMutation>;
export type RemoveTagsFromRebalancingGroupMutationOptions =
  Apollo.BaseMutationOptions<
    RemoveTagsFromRebalancingGroupMutation,
    RemoveTagsFromRebalancingGroupMutationVariables
  >;
export const RenameRebalancingGroupDocument = gql`
  mutation RenameRebalancingGroup($input: RenameRebalancingGroupInput!) {
    renameRebalancingGroup(input: $input) {
      id
      name
      description
      tagIds
      createdAt
      updatedAt
    }
  }
`;
export type RenameRebalancingGroupMutationFn = Apollo.MutationFunction<
  RenameRebalancingGroupMutation,
  RenameRebalancingGroupMutationVariables
>;

/**
 * __useRenameRebalancingGroupMutation__
 *
 * To run a mutation, you first call `useRenameRebalancingGroupMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRenameRebalancingGroupMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [renameRebalancingGroupMutation, { data, loading, error }] = useRenameRebalancingGroupMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useRenameRebalancingGroupMutation(
  baseOptions?: Apollo.MutationHookOptions<
    RenameRebalancingGroupMutation,
    RenameRebalancingGroupMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    RenameRebalancingGroupMutation,
    RenameRebalancingGroupMutationVariables
  >(RenameRebalancingGroupDocument, options);
}
export type RenameRebalancingGroupMutationHookResult = ReturnType<
  typeof useRenameRebalancingGroupMutation
>;
export type RenameRebalancingGroupMutationResult =
  Apollo.MutationResult<RenameRebalancingGroupMutation>;
export type RenameRebalancingGroupMutationOptions = Apollo.BaseMutationOptions<
  RenameRebalancingGroupMutation,
  RenameRebalancingGroupMutationVariables
>;
export const GetTagsDocument = gql`
  query GetTags {
    tags {
      id
      name
      description
      color
      createdAt
      updatedAt
    }
  }
`;

/**
 * __useGetTagsQuery__
 *
 * To run a query within a React component, call `useGetTagsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetTagsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetTagsQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetTagsQuery(
  baseOptions?: Apollo.QueryHookOptions<GetTagsQuery, GetTagsQueryVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<GetTagsQuery, GetTagsQueryVariables>(
    GetTagsDocument,
    options,
  );
}
export function useGetTagsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    GetTagsQuery,
    GetTagsQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<GetTagsQuery, GetTagsQueryVariables>(
    GetTagsDocument,
    options,
  );
}
export function useGetTagsSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<GetTagsQuery, GetTagsQueryVariables>,
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<GetTagsQuery, GetTagsQueryVariables>(
    GetTagsDocument,
    options,
  );
}
export type GetTagsQueryHookResult = ReturnType<typeof useGetTagsQuery>;
export type GetTagsLazyQueryHookResult = ReturnType<typeof useGetTagsLazyQuery>;
export type GetTagsSuspenseQueryHookResult = ReturnType<
  typeof useGetTagsSuspenseQuery
>;
export type GetTagsQueryResult = Apollo.QueryResult<
  GetTagsQuery,
  GetTagsQueryVariables
>;
export const CreateTagDocument = gql`
  mutation CreateTag($input: CreateTagInput!) {
    createTag(input: $input) {
      id
      name
      description
      color
      createdAt
      updatedAt
    }
  }
`;
export type CreateTagMutationFn = Apollo.MutationFunction<
  CreateTagMutation,
  CreateTagMutationVariables
>;

/**
 * __useCreateTagMutation__
 *
 * To run a mutation, you first call `useCreateTagMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateTagMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createTagMutation, { data, loading, error }] = useCreateTagMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateTagMutation(
  baseOptions?: Apollo.MutationHookOptions<
    CreateTagMutation,
    CreateTagMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<CreateTagMutation, CreateTagMutationVariables>(
    CreateTagDocument,
    options,
  );
}
export type CreateTagMutationHookResult = ReturnType<
  typeof useCreateTagMutation
>;
export type CreateTagMutationResult = Apollo.MutationResult<CreateTagMutation>;
export type CreateTagMutationOptions = Apollo.BaseMutationOptions<
  CreateTagMutation,
  CreateTagMutationVariables
>;
export const UpdateTagDocument = gql`
  mutation UpdateTag($input: UpdateTagInput!) {
    updateTag(input: $input) {
      id
      name
      description
      color
      createdAt
      updatedAt
    }
  }
`;
export type UpdateTagMutationFn = Apollo.MutationFunction<
  UpdateTagMutation,
  UpdateTagMutationVariables
>;

/**
 * __useUpdateTagMutation__
 *
 * To run a mutation, you first call `useUpdateTagMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateTagMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateTagMutation, { data, loading, error }] = useUpdateTagMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateTagMutation(
  baseOptions?: Apollo.MutationHookOptions<
    UpdateTagMutation,
    UpdateTagMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<UpdateTagMutation, UpdateTagMutationVariables>(
    UpdateTagDocument,
    options,
  );
}
export type UpdateTagMutationHookResult = ReturnType<
  typeof useUpdateTagMutation
>;
export type UpdateTagMutationResult = Apollo.MutationResult<UpdateTagMutation>;
export type UpdateTagMutationOptions = Apollo.BaseMutationOptions<
  UpdateTagMutation,
  UpdateTagMutationVariables
>;
export const DeleteTagDocument = gql`
  mutation DeleteTag($id: String!) {
    deleteTag(id: $id)
  }
`;
export type DeleteTagMutationFn = Apollo.MutationFunction<
  DeleteTagMutation,
  DeleteTagMutationVariables
>;

/**
 * __useDeleteTagMutation__
 *
 * To run a mutation, you first call `useDeleteTagMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteTagMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteTagMutation, { data, loading, error }] = useDeleteTagMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteTagMutation(
  baseOptions?: Apollo.MutationHookOptions<
    DeleteTagMutation,
    DeleteTagMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<DeleteTagMutation, DeleteTagMutationVariables>(
    DeleteTagDocument,
    options,
  );
}
export type DeleteTagMutationHookResult = ReturnType<
  typeof useDeleteTagMutation
>;
export type DeleteTagMutationResult = Apollo.MutationResult<DeleteTagMutation>;
export type DeleteTagMutationOptions = Apollo.BaseMutationOptions<
  DeleteTagMutation,
  DeleteTagMutationVariables
>;
