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
