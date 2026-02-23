/* eslint-disable */
import * as types from './graphql';
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "mutation CreateProject($name: String!) {\n  createProject(name: $name) {\n    id\n    name\n  }\n}": typeof types.CreateProjectDocument,
    "query GetProjectMessages($projectId: ID!) {\n  project(id: $projectId) {\n    id\n    messages {\n      id\n      content\n      role\n      createdAt\n    }\n  }\n}": typeof types.GetProjectMessagesDocument,
    "query GetProjects {\n  projects {\n    id\n    name\n  }\n}": typeof types.GetProjectsDocument,
    "mutation SendMessage($projectId: ID!, $content: String!) {\n  sendMessage(projectId: $projectId, content: $content) {\n    id\n    content\n    role\n    createdAt\n  }\n}": typeof types.SendMessageDocument,
};
const documents: Documents = {
    "mutation CreateProject($name: String!) {\n  createProject(name: $name) {\n    id\n    name\n  }\n}": types.CreateProjectDocument,
    "query GetProjectMessages($projectId: ID!) {\n  project(id: $projectId) {\n    id\n    messages {\n      id\n      content\n      role\n      createdAt\n    }\n  }\n}": types.GetProjectMessagesDocument,
    "query GetProjects {\n  projects {\n    id\n    name\n  }\n}": types.GetProjectsDocument,
    "mutation SendMessage($projectId: ID!, $content: String!) {\n  sendMessage(projectId: $projectId, content: $content) {\n    id\n    content\n    role\n    createdAt\n  }\n}": types.SendMessageDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation CreateProject($name: String!) {\n  createProject(name: $name) {\n    id\n    name\n  }\n}"): (typeof documents)["mutation CreateProject($name: String!) {\n  createProject(name: $name) {\n    id\n    name\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query GetProjectMessages($projectId: ID!) {\n  project(id: $projectId) {\n    id\n    messages {\n      id\n      content\n      role\n      createdAt\n    }\n  }\n}"): (typeof documents)["query GetProjectMessages($projectId: ID!) {\n  project(id: $projectId) {\n    id\n    messages {\n      id\n      content\n      role\n      createdAt\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query GetProjects {\n  projects {\n    id\n    name\n  }\n}"): (typeof documents)["query GetProjects {\n  projects {\n    id\n    name\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation SendMessage($projectId: ID!, $content: String!) {\n  sendMessage(projectId: $projectId, content: $content) {\n    id\n    content\n    role\n    createdAt\n  }\n}"): (typeof documents)["mutation SendMessage($projectId: ID!, $content: String!) {\n  sendMessage(projectId: $projectId, content: $content) {\n    id\n    content\n    role\n    createdAt\n  }\n}"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;