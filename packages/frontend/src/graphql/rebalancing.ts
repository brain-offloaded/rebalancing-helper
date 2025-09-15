import { gql } from '@apollo/client';

export const GET_REBALANCING_GROUPS = gql`
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

export const GET_REBALANCING_ANALYSIS = gql`
  query GetRebalancingAnalysis($groupId: String!) {
    rebalancingAnalysis(groupId: $groupId) {
      groupId
      groupName
      totalValue
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

export const GET_INVESTMENT_RECOMMENDATION = gql`
  query GetInvestmentRecommendation($input: CalculateInvestmentInput!) {
    investmentRecommendation(input: $input) {
      tagId
      tagName
      recommendedAmount
      recommendedPercentage
      suggestedSymbols
    }
  }
`;

export const CREATE_REBALANCING_GROUP = gql`
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

export const UPDATE_REBALANCING_GROUP = gql`
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

export const DELETE_REBALANCING_GROUP = gql`
  mutation DeleteRebalancingGroup($id: String!) {
    deleteRebalancingGroup(id: $id)
  }
`;

export const SET_TARGET_ALLOCATIONS = gql`
  mutation SetTargetAllocations($input: SetTargetAllocationsInput!) {
    setTargetAllocations(input: $input)
  }
`;