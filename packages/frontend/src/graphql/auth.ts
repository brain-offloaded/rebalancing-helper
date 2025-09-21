import { gql } from '@apollo/client';

export const LOGIN_MUTATION = gql`
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

export const REGISTER_MUTATION = gql`
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

export const ME_QUERY = gql`
  query Me {
    me {
      id
      email
      createdAt
      updatedAt
    }
  }
`;
