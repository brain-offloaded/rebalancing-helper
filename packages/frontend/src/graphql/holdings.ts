import { gql } from '@apollo/client';

export const GET_HOLDING_TAGS = gql`
  query GetHoldingTags($holdingSymbol: String) {
    holdingTags(holdingSymbol: $holdingSymbol) {
      id
      holdingSymbol
      tagId
      createdAt
    }
  }
`;

export const GET_TAGS_FOR_HOLDING = gql`
  query GetTagsForHolding($holdingSymbol: String!) {
    tagsForHolding(holdingSymbol: $holdingSymbol)
  }
`;

export const GET_HOLDINGS_FOR_TAG = gql`
  query GetHoldingsForTag($tagId: String!) {
    holdingsForTag(tagId: $tagId)
  }
`;

export const ADD_HOLDING_TAG = gql`
  mutation AddHoldingTag($input: AddHoldingTagInput!) {
    addHoldingTag(input: $input) {
      id
      holdingSymbol
      tagId
      createdAt
    }
  }
`;

export const REMOVE_HOLDING_TAG = gql`
  mutation RemoveHoldingTag($input: RemoveHoldingTagInput!) {
    removeHoldingTag(input: $input)
  }
`;

export const SET_HOLDING_TAGS = gql`
  mutation SetHoldingTags($input: SetHoldingTagsInput!) {
    setHoldingTags(input: $input) {
      id
      holdingSymbol
      tagId
      createdAt
    }
  }
`;

export const GET_HOLDINGS = gql`
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
      averageCost
      currency
      lastUpdated
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_MANUAL_HOLDING = gql`
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

export const INCREASE_MANUAL_HOLDING = gql`
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

export const SET_MANUAL_HOLDING_QUANTITY = gql`
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

export const DELETE_MANUAL_HOLDING = gql`
  mutation DeleteManualHolding($input: ManualHoldingIdentifierInput!) {
    deleteManualHolding(input: $input)
  }
`;

export const SYNC_MANUAL_HOLDING_PRICE = gql`
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
      averageCost
      currency
      createdAt
      updatedAt
    }
  }
`;
