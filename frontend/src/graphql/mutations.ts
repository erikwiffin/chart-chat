import { gql } from "@apollo/client/core";

export const CREATE_PROJECT = gql`
  mutation CreateProject($name: String!) {
    createProject(name: $name) {
      id
      name
    }
  }
`;

export const SEND_MESSAGE = gql`
  mutation SendMessage($projectId: ID!, $content: String!) {
    sendMessage(projectId: $projectId, content: $content) {
      id
      content
      role
      createdAt
    }
  }
`;
