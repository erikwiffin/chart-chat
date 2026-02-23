import { gql } from "@apollo/client/core";

export const GET_PROJECTS = gql`
  query GetProjects {
    projects {
      id
      name
    }
  }
`;

export const GET_PROJECT_MESSAGES = gql`
  query GetProjectMessages($projectId: ID!) {
    project(id: $projectId) {
      id
      messages {
        id
        content
        role
        createdAt
      }
    }
  }
`;
