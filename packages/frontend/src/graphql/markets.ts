import { gql } from '@apollo/client';

export const GET_MARKETS = gql`
  query GetMarkets {
    markets {
      id
      code
      displayName
      yahooSuffix
    }
  }
`;
