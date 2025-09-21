import { gql } from '@apollo/client';

export const GET_BROKERAGE_ACCOUNTS = gql`
  query GetBrokerageAccounts {
    brokerageAccounts {
      id
      name
      brokerName
      description
      isActive
      createdAt
      updatedAt
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
      brokerName
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
      brokerName
      description
      isActive
      createdAt
      updatedAt
    }
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
