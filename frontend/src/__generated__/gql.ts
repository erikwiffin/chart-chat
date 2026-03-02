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
    "subscription ChartAdded($projectId: ID!) {\n  chartAdded(projectId: $projectId) {\n    id\n    title\n    spec\n    version\n    createdAt\n    thumbnailUrl\n  }\n}": typeof types.ChartAddedDocument,
    "subscription ChartUpdated($projectId: ID!) {\n  chartUpdated(projectId: $projectId) {\n    id\n    title\n    spec\n    version\n    createdAt\n    thumbnailUrl\n  }\n}": typeof types.ChartUpdatedDocument,
    "mutation CreateProject($name: String!) {\n  createProject(name: $name) {\n    id\n    name\n  }\n}": typeof types.CreateProjectDocument,
    "mutation CreateProjectFromPrompt($content: String!) {\n  createProjectFromPrompt(content: $content) {\n    id\n    name\n  }\n}": typeof types.CreateProjectFromPromptDocument,
    "mutation DeleteChart($chartId: ID!) {\n  deleteChart(chartId: $chartId)\n}": typeof types.DeleteChartDocument,
    "mutation DeleteDataSource($dataSourceId: ID!) {\n  deleteDataSource(dataSourceId: $dataSourceId)\n}": typeof types.DeleteDataSourceDocument,
    "query GetChartRevisions($chartId: ID!) {\n  chartRevisions(chartId: $chartId) {\n    id\n    version\n    spec\n    createdAt\n  }\n}": typeof types.GetChartRevisionsDocument,
    "query GetProjectCharts($id: ID!) {\n  project(id: $id) {\n    id\n    charts {\n      id\n      title\n      spec\n      version\n      createdAt\n      thumbnailUrl\n    }\n  }\n}": typeof types.GetProjectChartsDocument,
    "query GetProjectDataSources($id: ID!) {\n  project(id: $id) {\n    id\n    dataSources {\n      id\n      name\n      sourceType\n      columns\n      rowCount\n      createdAt\n    }\n  }\n}": typeof types.GetProjectDataSourcesDocument,
    "query GetProjectMessages($projectId: ID!) {\n  project(id: $projectId) {\n    id\n    messages {\n      id\n      content\n      role\n      createdAt\n    }\n  }\n}": typeof types.GetProjectMessagesDocument,
    "query GetProjects {\n  projects {\n    id\n    name\n  }\n}": typeof types.GetProjectsDocument,
    "subscription MessageAdded($projectId: ID!) {\n  messageAdded(projectId: $projectId) {\n    id\n    content\n    role\n    createdAt\n  }\n}": typeof types.MessageAddedDocument,
    "subscription ProjectNameUpdated($projectId: ID!) {\n  projectNameUpdated(projectId: $projectId) {\n    id\n    name\n  }\n}": typeof types.ProjectNameUpdatedDocument,
    "mutation RevertChart($chartId: ID!, $version: Int!) {\n  revertChart(chartId: $chartId, version: $version) {\n    id\n    title\n    spec\n    version\n    createdAt\n  }\n}": typeof types.RevertChartDocument,
    "mutation SendMessage($projectId: ID!, $content: String!, $activeChartId: ID) {\n  sendMessage(\n    projectId: $projectId\n    content: $content\n    activeChartId: $activeChartId\n  ) {\n    id\n    content\n    role\n    createdAt\n  }\n}": typeof types.SendMessageDocument,
    "subscription StatusUpdate($projectId: ID!) {\n  statusUpdate(projectId: $projectId) {\n    message\n    task\n  }\n}": typeof types.StatusUpdateDocument,
    "mutation StopGeneration($projectId: ID!) {\n  stopGeneration(projectId: $projectId)\n}": typeof types.StopGenerationDocument,
    "mutation UpdateChart($chartId: ID!, $title: String!, $spec: String!) {\n  updateChart(chartId: $chartId, title: $title, spec: $spec) {\n    id\n    title\n    spec\n    version\n    createdAt\n  }\n}": typeof types.UpdateChartDocument,
};
const documents: Documents = {
    "subscription ChartAdded($projectId: ID!) {\n  chartAdded(projectId: $projectId) {\n    id\n    title\n    spec\n    version\n    createdAt\n    thumbnailUrl\n  }\n}": types.ChartAddedDocument,
    "subscription ChartUpdated($projectId: ID!) {\n  chartUpdated(projectId: $projectId) {\n    id\n    title\n    spec\n    version\n    createdAt\n    thumbnailUrl\n  }\n}": types.ChartUpdatedDocument,
    "mutation CreateProject($name: String!) {\n  createProject(name: $name) {\n    id\n    name\n  }\n}": types.CreateProjectDocument,
    "mutation CreateProjectFromPrompt($content: String!) {\n  createProjectFromPrompt(content: $content) {\n    id\n    name\n  }\n}": types.CreateProjectFromPromptDocument,
    "mutation DeleteChart($chartId: ID!) {\n  deleteChart(chartId: $chartId)\n}": types.DeleteChartDocument,
    "mutation DeleteDataSource($dataSourceId: ID!) {\n  deleteDataSource(dataSourceId: $dataSourceId)\n}": types.DeleteDataSourceDocument,
    "query GetChartRevisions($chartId: ID!) {\n  chartRevisions(chartId: $chartId) {\n    id\n    version\n    spec\n    createdAt\n  }\n}": types.GetChartRevisionsDocument,
    "query GetProjectCharts($id: ID!) {\n  project(id: $id) {\n    id\n    charts {\n      id\n      title\n      spec\n      version\n      createdAt\n      thumbnailUrl\n    }\n  }\n}": types.GetProjectChartsDocument,
    "query GetProjectDataSources($id: ID!) {\n  project(id: $id) {\n    id\n    dataSources {\n      id\n      name\n      sourceType\n      columns\n      rowCount\n      createdAt\n    }\n  }\n}": types.GetProjectDataSourcesDocument,
    "query GetProjectMessages($projectId: ID!) {\n  project(id: $projectId) {\n    id\n    messages {\n      id\n      content\n      role\n      createdAt\n    }\n  }\n}": types.GetProjectMessagesDocument,
    "query GetProjects {\n  projects {\n    id\n    name\n  }\n}": types.GetProjectsDocument,
    "subscription MessageAdded($projectId: ID!) {\n  messageAdded(projectId: $projectId) {\n    id\n    content\n    role\n    createdAt\n  }\n}": types.MessageAddedDocument,
    "subscription ProjectNameUpdated($projectId: ID!) {\n  projectNameUpdated(projectId: $projectId) {\n    id\n    name\n  }\n}": types.ProjectNameUpdatedDocument,
    "mutation RevertChart($chartId: ID!, $version: Int!) {\n  revertChart(chartId: $chartId, version: $version) {\n    id\n    title\n    spec\n    version\n    createdAt\n  }\n}": types.RevertChartDocument,
    "mutation SendMessage($projectId: ID!, $content: String!, $activeChartId: ID) {\n  sendMessage(\n    projectId: $projectId\n    content: $content\n    activeChartId: $activeChartId\n  ) {\n    id\n    content\n    role\n    createdAt\n  }\n}": types.SendMessageDocument,
    "subscription StatusUpdate($projectId: ID!) {\n  statusUpdate(projectId: $projectId) {\n    message\n    task\n  }\n}": types.StatusUpdateDocument,
    "mutation StopGeneration($projectId: ID!) {\n  stopGeneration(projectId: $projectId)\n}": types.StopGenerationDocument,
    "mutation UpdateChart($chartId: ID!, $title: String!, $spec: String!) {\n  updateChart(chartId: $chartId, title: $title, spec: $spec) {\n    id\n    title\n    spec\n    version\n    createdAt\n  }\n}": types.UpdateChartDocument,
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
export function graphql(source: "subscription ChartAdded($projectId: ID!) {\n  chartAdded(projectId: $projectId) {\n    id\n    title\n    spec\n    version\n    createdAt\n    thumbnailUrl\n  }\n}"): (typeof documents)["subscription ChartAdded($projectId: ID!) {\n  chartAdded(projectId: $projectId) {\n    id\n    title\n    spec\n    version\n    createdAt\n    thumbnailUrl\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "subscription ChartUpdated($projectId: ID!) {\n  chartUpdated(projectId: $projectId) {\n    id\n    title\n    spec\n    version\n    createdAt\n    thumbnailUrl\n  }\n}"): (typeof documents)["subscription ChartUpdated($projectId: ID!) {\n  chartUpdated(projectId: $projectId) {\n    id\n    title\n    spec\n    version\n    createdAt\n    thumbnailUrl\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation CreateProject($name: String!) {\n  createProject(name: $name) {\n    id\n    name\n  }\n}"): (typeof documents)["mutation CreateProject($name: String!) {\n  createProject(name: $name) {\n    id\n    name\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation CreateProjectFromPrompt($content: String!) {\n  createProjectFromPrompt(content: $content) {\n    id\n    name\n  }\n}"): (typeof documents)["mutation CreateProjectFromPrompt($content: String!) {\n  createProjectFromPrompt(content: $content) {\n    id\n    name\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation DeleteChart($chartId: ID!) {\n  deleteChart(chartId: $chartId)\n}"): (typeof documents)["mutation DeleteChart($chartId: ID!) {\n  deleteChart(chartId: $chartId)\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation DeleteDataSource($dataSourceId: ID!) {\n  deleteDataSource(dataSourceId: $dataSourceId)\n}"): (typeof documents)["mutation DeleteDataSource($dataSourceId: ID!) {\n  deleteDataSource(dataSourceId: $dataSourceId)\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query GetChartRevisions($chartId: ID!) {\n  chartRevisions(chartId: $chartId) {\n    id\n    version\n    spec\n    createdAt\n  }\n}"): (typeof documents)["query GetChartRevisions($chartId: ID!) {\n  chartRevisions(chartId: $chartId) {\n    id\n    version\n    spec\n    createdAt\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query GetProjectCharts($id: ID!) {\n  project(id: $id) {\n    id\n    charts {\n      id\n      title\n      spec\n      version\n      createdAt\n      thumbnailUrl\n    }\n  }\n}"): (typeof documents)["query GetProjectCharts($id: ID!) {\n  project(id: $id) {\n    id\n    charts {\n      id\n      title\n      spec\n      version\n      createdAt\n      thumbnailUrl\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query GetProjectDataSources($id: ID!) {\n  project(id: $id) {\n    id\n    dataSources {\n      id\n      name\n      sourceType\n      columns\n      rowCount\n      createdAt\n    }\n  }\n}"): (typeof documents)["query GetProjectDataSources($id: ID!) {\n  project(id: $id) {\n    id\n    dataSources {\n      id\n      name\n      sourceType\n      columns\n      rowCount\n      createdAt\n    }\n  }\n}"];
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
export function graphql(source: "subscription MessageAdded($projectId: ID!) {\n  messageAdded(projectId: $projectId) {\n    id\n    content\n    role\n    createdAt\n  }\n}"): (typeof documents)["subscription MessageAdded($projectId: ID!) {\n  messageAdded(projectId: $projectId) {\n    id\n    content\n    role\n    createdAt\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "subscription ProjectNameUpdated($projectId: ID!) {\n  projectNameUpdated(projectId: $projectId) {\n    id\n    name\n  }\n}"): (typeof documents)["subscription ProjectNameUpdated($projectId: ID!) {\n  projectNameUpdated(projectId: $projectId) {\n    id\n    name\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation RevertChart($chartId: ID!, $version: Int!) {\n  revertChart(chartId: $chartId, version: $version) {\n    id\n    title\n    spec\n    version\n    createdAt\n  }\n}"): (typeof documents)["mutation RevertChart($chartId: ID!, $version: Int!) {\n  revertChart(chartId: $chartId, version: $version) {\n    id\n    title\n    spec\n    version\n    createdAt\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation SendMessage($projectId: ID!, $content: String!, $activeChartId: ID) {\n  sendMessage(\n    projectId: $projectId\n    content: $content\n    activeChartId: $activeChartId\n  ) {\n    id\n    content\n    role\n    createdAt\n  }\n}"): (typeof documents)["mutation SendMessage($projectId: ID!, $content: String!, $activeChartId: ID) {\n  sendMessage(\n    projectId: $projectId\n    content: $content\n    activeChartId: $activeChartId\n  ) {\n    id\n    content\n    role\n    createdAt\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "subscription StatusUpdate($projectId: ID!) {\n  statusUpdate(projectId: $projectId) {\n    message\n    task\n  }\n}"): (typeof documents)["subscription StatusUpdate($projectId: ID!) {\n  statusUpdate(projectId: $projectId) {\n    message\n    task\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation StopGeneration($projectId: ID!) {\n  stopGeneration(projectId: $projectId)\n}"): (typeof documents)["mutation StopGeneration($projectId: ID!) {\n  stopGeneration(projectId: $projectId)\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation UpdateChart($chartId: ID!, $title: String!, $spec: String!) {\n  updateChart(chartId: $chartId, title: $title, spec: $spec) {\n    id\n    title\n    spec\n    version\n    createdAt\n  }\n}"): (typeof documents)["mutation UpdateChart($chartId: ID!, $title: String!, $spec: String!) {\n  updateChart(chartId: $chartId, title: $title, spec: $spec) {\n    id\n    title\n    spec\n    version\n    createdAt\n  }\n}"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;