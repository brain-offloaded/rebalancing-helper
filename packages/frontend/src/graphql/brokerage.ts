import { gql } from '@apollo/client';

export const GET_BROKERAGE_ACCOUNTS = gql`
  query GetBrokerageAccounts {
    brokerageAccounts {
      id
      name
      brokerId
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

export const GET_BROKERS = gql`
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

export const GET_BROKERAGE_HOLDINGS = gql`
  query GetBrokerageHoldings($accountId: String) {
    brokerageHoldings(accountId: $accountId) {
      id
      symbol
      name
      quantity
      currentPrice
      marketValue
      averageCost
      currency
      accountId
      lastUpdated
    }
  }
`;

export const CREATE_BROKERAGE_ACCOUNT = gql`
  mutation CreateBrokerageAccount($input: CreateBrokerageAccountInput!) {
    createBrokerageAccount(input: $input) {
      id
      name
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

export const UPDATE_BROKERAGE_ACCOUNT = gql`
  mutation UpdateBrokerageAccount($input: UpdateBrokerageAccountInput!) {
    updateBrokerageAccount(input: $input) {
      id
      name
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

export const CREATE_BROKER = gql`
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

export const UPDATE_BROKER = gql`
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

export const DELETE_BROKER = gql`
  mutation DeleteBroker($id: String!) {
    deleteBroker(id: $id)
  }
`;

export const DELETE_BROKERAGE_ACCOUNT = gql`
  mutation DeleteBrokerageAccount($id: String!) {
    deleteBrokerageAccount(id: $id)
  }
`;

export const REFRESH_BROKERAGE_HOLDINGS = gql`
  mutation RefreshBrokerageHoldings($accountId: String!) {
    refreshBrokerageHoldings(accountId: $accountId) {
      id
      symbol
      name
      quantity
      currentPrice
      marketValue
      averageCost
      currency
      accountId
      lastUpdated
    }
  }
`;

export const INCREMENT_BROKERAGE_HOLDING_QUANTITY = gql`
  mutation IncrementBrokerageHoldingQuantity(
    $input: IncrementHoldingQuantityInput!
  ) {
    incrementBrokerageHoldingQuantity(input: $input) {
      id
      symbol
      name
      quantity
      currentPrice
      marketValue
      averageCost
      currency
      accountId
      lastUpdated
    }
  }
`;

export const SET_BROKERAGE_HOLDING_QUANTITY = gql`
  mutation SetBrokerageHoldingQuantity($input: SetHoldingQuantityInput!) {
    setBrokerageHoldingQuantity(input: $input) {
      id
      symbol
      name
      quantity
      currentPrice
      marketValue
      averageCost
      currency
      accountId
      lastUpdated
    }
  }
`;

export const SYNC_BROKERAGE_HOLDING_PRICE = gql`
  mutation SyncBrokerageHoldingPrice($input: SyncHoldingPriceInput!) {
    syncBrokerageHoldingPrice(input: $input) {
      id
      symbol
      name
      quantity
      currentPrice
      marketValue
      averageCost
      currency
      accountId
      lastUpdated
    }
  }
`;
