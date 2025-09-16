import { gql } from '@apollo/client';

export const GET_TAGS = gql`
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

export const CREATE_TAG = gql`
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

export const UPDATE_TAG = gql`
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

export const DELETE_TAG = gql`
  mutation DeleteTag($id: String!) {
    deleteTag(id: $id)
  }
`;