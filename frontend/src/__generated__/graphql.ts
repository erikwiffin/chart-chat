/* eslint-disable */
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = T | null | undefined;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
};

export type Chart = {
  __typename?: 'Chart';
  createdAt: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  spec: Scalars['String']['output'];
  thumbnailUrl?: Maybe<Scalars['String']['output']>;
  title: Scalars['String']['output'];
  version: Scalars['Int']['output'];
};

export type ChartDeletedEvent = {
  __typename?: 'ChartDeletedEvent';
  id: Scalars['ID']['output'];
};

export type ChartRevision = {
  __typename?: 'ChartRevision';
  createdAt: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  spec: Scalars['String']['output'];
  version: Scalars['Int']['output'];
};

export type DataSource = {
  __typename?: 'DataSource';
  columns: Array<Scalars['String']['output']>;
  createdAt: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  rowCount: Scalars['Int']['output'];
  sourceType: Scalars['String']['output'];
};

export type Message = {
  __typename?: 'Message';
  content: Scalars['String']['output'];
  createdAt: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  role: MessageRole;
};

export type MessageRole =
  | 'assistant'
  | 'user';

export type Mutation = {
  __typename?: 'Mutation';
  createProject: Project;
  createProjectFromPrompt: Project;
  createUser: User;
  deleteChart: Scalars['Boolean']['output'];
  deleteDataSource: Scalars['Boolean']['output'];
  revertChart: Chart;
  sendMessage: Message;
  stopGeneration: Scalars['Boolean']['output'];
  updateChart: Chart;
};


export type MutationCreateProjectArgs = {
  name: Scalars['String']['input'];
};


export type MutationCreateProjectFromPromptArgs = {
  content: Scalars['String']['input'];
};


export type MutationCreateUserArgs = {
  email: Scalars['String']['input'];
  name: Scalars['String']['input'];
};


export type MutationDeleteChartArgs = {
  chartId: Scalars['ID']['input'];
};


export type MutationDeleteDataSourceArgs = {
  dataSourceId: Scalars['ID']['input'];
};


export type MutationRevertChartArgs = {
  chartId: Scalars['ID']['input'];
  version: Scalars['Int']['input'];
};


export type MutationSendMessageArgs = {
  activeChartId?: InputMaybe<Scalars['ID']['input']>;
  content: Scalars['String']['input'];
  projectId: Scalars['ID']['input'];
};


export type MutationStopGenerationArgs = {
  projectId: Scalars['ID']['input'];
};


export type MutationUpdateChartArgs = {
  chartId: Scalars['ID']['input'];
  spec: Scalars['String']['input'];
  title: Scalars['String']['input'];
};

export type Project = {
  __typename?: 'Project';
  charts: Array<Chart>;
  createdAt: Scalars['String']['output'];
  dataSources: Array<DataSource>;
  id: Scalars['ID']['output'];
  messages: Array<Message>;
  name: Scalars['String']['output'];
  uuid: Scalars['String']['output'];
};

export type Query = {
  __typename?: 'Query';
  chart?: Maybe<Chart>;
  chartRevisions: Array<ChartRevision>;
  hello: Scalars['String']['output'];
  project?: Maybe<Project>;
  projects: Array<Project>;
  users: Array<User>;
};


export type QueryChartArgs = {
  id: Scalars['ID']['input'];
};


export type QueryChartRevisionsArgs = {
  chartId: Scalars['ID']['input'];
};


export type QueryProjectArgs = {
  id: Scalars['ID']['input'];
};

export type StatusUpdate = {
  __typename?: 'StatusUpdate';
  isGenerating: Scalars['Boolean']['output'];
  message: Scalars['String']['output'];
  task: Scalars['String']['output'];
};

export type Subscription = {
  __typename?: 'Subscription';
  chartAdded: Chart;
  chartDeleted: ChartDeletedEvent;
  chartUpdated: Chart;
  messageAdded: Message;
  projectNameUpdated: Project;
  statusUpdate: StatusUpdate;
};


export type SubscriptionChartAddedArgs = {
  projectId: Scalars['ID']['input'];
};


export type SubscriptionChartDeletedArgs = {
  projectId: Scalars['ID']['input'];
};


export type SubscriptionChartUpdatedArgs = {
  projectId: Scalars['ID']['input'];
};


export type SubscriptionMessageAddedArgs = {
  projectId: Scalars['ID']['input'];
};


export type SubscriptionProjectNameUpdatedArgs = {
  projectId: Scalars['ID']['input'];
};


export type SubscriptionStatusUpdateArgs = {
  projectId: Scalars['ID']['input'];
};

export type User = {
  __typename?: 'User';
  email: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
};

export type ChartAddedSubscriptionVariables = Exact<{
  projectId: Scalars['ID']['input'];
}>;


export type ChartAddedSubscription = { __typename?: 'Subscription', chartAdded: { __typename?: 'Chart', id: string, title: string, spec: string, version: number, createdAt: string, thumbnailUrl?: string | null } };

export type ChartDeletedSubscriptionVariables = Exact<{
  projectId: Scalars['ID']['input'];
}>;


export type ChartDeletedSubscription = { __typename?: 'Subscription', chartDeleted: { __typename?: 'ChartDeletedEvent', id: string } };

export type ChartUpdatedSubscriptionVariables = Exact<{
  projectId: Scalars['ID']['input'];
}>;


export type ChartUpdatedSubscription = { __typename?: 'Subscription', chartUpdated: { __typename?: 'Chart', id: string, title: string, spec: string, version: number, createdAt: string, thumbnailUrl?: string | null } };

export type CreateProjectMutationVariables = Exact<{
  name: Scalars['String']['input'];
}>;


export type CreateProjectMutation = { __typename?: 'Mutation', createProject: { __typename?: 'Project', id: string, name: string } };

export type CreateProjectFromPromptMutationVariables = Exact<{
  content: Scalars['String']['input'];
}>;


export type CreateProjectFromPromptMutation = { __typename?: 'Mutation', createProjectFromPrompt: { __typename?: 'Project', id: string, name: string } };

export type DeleteChartMutationVariables = Exact<{
  chartId: Scalars['ID']['input'];
}>;


export type DeleteChartMutation = { __typename?: 'Mutation', deleteChart: boolean };

export type DeleteDataSourceMutationVariables = Exact<{
  dataSourceId: Scalars['ID']['input'];
}>;


export type DeleteDataSourceMutation = { __typename?: 'Mutation', deleteDataSource: boolean };

export type GetChartQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetChartQuery = { __typename?: 'Query', chart?: { __typename?: 'Chart', id: string, title: string, spec: string, version: number, createdAt: string, thumbnailUrl?: string | null } | null };

export type GetChartRevisionsQueryVariables = Exact<{
  chartId: Scalars['ID']['input'];
}>;


export type GetChartRevisionsQuery = { __typename?: 'Query', chartRevisions: Array<{ __typename?: 'ChartRevision', id: string, version: number, spec: string, createdAt: string }> };

export type GetProjectQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetProjectQuery = { __typename?: 'Query', project?: { __typename?: 'Project', id: string, name: string } | null };

export type GetProjectChartsQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetProjectChartsQuery = { __typename?: 'Query', project?: { __typename?: 'Project', id: string, charts: Array<{ __typename?: 'Chart', id: string, title: string, spec: string, version: number, createdAt: string, thumbnailUrl?: string | null }> } | null };

export type GetProjectDataSourcesQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetProjectDataSourcesQuery = { __typename?: 'Query', project?: { __typename?: 'Project', id: string, dataSources: Array<{ __typename?: 'DataSource', id: string, name: string, sourceType: string, columns: Array<string>, rowCount: number, createdAt: string }> } | null };

export type GetProjectMessagesQueryVariables = Exact<{
  projectId: Scalars['ID']['input'];
}>;


export type GetProjectMessagesQuery = { __typename?: 'Query', project?: { __typename?: 'Project', id: string, messages: Array<{ __typename?: 'Message', id: string, content: string, role: MessageRole, createdAt: string }> } | null };

export type GetProjectsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetProjectsQuery = { __typename?: 'Query', projects: Array<{ __typename?: 'Project', id: string, name: string }> };

export type MessageAddedSubscriptionVariables = Exact<{
  projectId: Scalars['ID']['input'];
}>;


export type MessageAddedSubscription = { __typename?: 'Subscription', messageAdded: { __typename?: 'Message', id: string, content: string, role: MessageRole, createdAt: string } };

export type ProjectNameUpdatedSubscriptionVariables = Exact<{
  projectId: Scalars['ID']['input'];
}>;


export type ProjectNameUpdatedSubscription = { __typename?: 'Subscription', projectNameUpdated: { __typename?: 'Project', id: string, name: string } };

export type RevertChartMutationVariables = Exact<{
  chartId: Scalars['ID']['input'];
  version: Scalars['Int']['input'];
}>;


export type RevertChartMutation = { __typename?: 'Mutation', revertChart: { __typename?: 'Chart', id: string, title: string, spec: string, version: number, createdAt: string } };

export type SendMessageMutationVariables = Exact<{
  projectId: Scalars['ID']['input'];
  content: Scalars['String']['input'];
  activeChartId?: InputMaybe<Scalars['ID']['input']>;
}>;


export type SendMessageMutation = { __typename?: 'Mutation', sendMessage: { __typename?: 'Message', id: string, content: string, role: MessageRole, createdAt: string } };

export type StatusUpdateSubscriptionVariables = Exact<{
  projectId: Scalars['ID']['input'];
}>;


export type StatusUpdateSubscription = { __typename?: 'Subscription', statusUpdate: { __typename?: 'StatusUpdate', message: string, task: string, isGenerating: boolean } };

export type StopGenerationMutationVariables = Exact<{
  projectId: Scalars['ID']['input'];
}>;


export type StopGenerationMutation = { __typename?: 'Mutation', stopGeneration: boolean };

export type UpdateChartMutationVariables = Exact<{
  chartId: Scalars['ID']['input'];
  title: Scalars['String']['input'];
  spec: Scalars['String']['input'];
}>;


export type UpdateChartMutation = { __typename?: 'Mutation', updateChart: { __typename?: 'Chart', id: string, title: string, spec: string, version: number, createdAt: string } };


export const ChartAddedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"ChartAdded"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"chartAdded"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"spec"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"thumbnailUrl"}}]}}]}}]} as unknown as DocumentNode<ChartAddedSubscription, ChartAddedSubscriptionVariables>;
export const ChartDeletedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"ChartDeleted"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"chartDeleted"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<ChartDeletedSubscription, ChartDeletedSubscriptionVariables>;
export const ChartUpdatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"ChartUpdated"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"chartUpdated"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"spec"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"thumbnailUrl"}}]}}]}}]} as unknown as DocumentNode<ChartUpdatedSubscription, ChartUpdatedSubscriptionVariables>;
export const CreateProjectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateProject"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createProject"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<CreateProjectMutation, CreateProjectMutationVariables>;
export const CreateProjectFromPromptDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateProjectFromPrompt"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"content"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createProjectFromPrompt"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"content"},"value":{"kind":"Variable","name":{"kind":"Name","value":"content"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<CreateProjectFromPromptMutation, CreateProjectFromPromptMutationVariables>;
export const DeleteChartDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteChart"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"chartId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteChart"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"chartId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"chartId"}}}]}]}}]} as unknown as DocumentNode<DeleteChartMutation, DeleteChartMutationVariables>;
export const DeleteDataSourceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteDataSource"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"dataSourceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteDataSource"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"dataSourceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"dataSourceId"}}}]}]}}]} as unknown as DocumentNode<DeleteDataSourceMutation, DeleteDataSourceMutationVariables>;
export const GetChartDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetChart"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"chart"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"spec"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"thumbnailUrl"}}]}}]}}]} as unknown as DocumentNode<GetChartQuery, GetChartQueryVariables>;
export const GetChartRevisionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetChartRevisions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"chartId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"chartRevisions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"chartId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"chartId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"spec"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<GetChartRevisionsQuery, GetChartRevisionsQueryVariables>;
export const GetProjectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetProject"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<GetProjectQuery, GetProjectQueryVariables>;
export const GetProjectChartsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetProjectCharts"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"charts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"spec"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"thumbnailUrl"}}]}}]}}]}}]} as unknown as DocumentNode<GetProjectChartsQuery, GetProjectChartsQueryVariables>;
export const GetProjectDataSourcesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetProjectDataSources"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"dataSources"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"sourceType"}},{"kind":"Field","name":{"kind":"Name","value":"columns"}},{"kind":"Field","name":{"kind":"Name","value":"rowCount"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]}}]} as unknown as DocumentNode<GetProjectDataSourcesQuery, GetProjectDataSourcesQueryVariables>;
export const GetProjectMessagesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetProjectMessages"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"messages"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]}}]} as unknown as DocumentNode<GetProjectMessagesQuery, GetProjectMessagesQueryVariables>;
export const GetProjectsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetProjects"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projects"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<GetProjectsQuery, GetProjectsQueryVariables>;
export const MessageAddedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"MessageAdded"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"messageAdded"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<MessageAddedSubscription, MessageAddedSubscriptionVariables>;
export const ProjectNameUpdatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"ProjectNameUpdated"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectNameUpdated"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<ProjectNameUpdatedSubscription, ProjectNameUpdatedSubscriptionVariables>;
export const RevertChartDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RevertChart"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"chartId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"version"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"revertChart"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"chartId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"chartId"}}},{"kind":"Argument","name":{"kind":"Name","value":"version"},"value":{"kind":"Variable","name":{"kind":"Name","value":"version"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"spec"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<RevertChartMutation, RevertChartMutationVariables>;
export const SendMessageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SendMessage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"content"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"activeChartId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sendMessage"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}},{"kind":"Argument","name":{"kind":"Name","value":"content"},"value":{"kind":"Variable","name":{"kind":"Name","value":"content"}}},{"kind":"Argument","name":{"kind":"Name","value":"activeChartId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"activeChartId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<SendMessageMutation, SendMessageMutationVariables>;
export const StatusUpdateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"StatusUpdate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"statusUpdate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"task"}},{"kind":"Field","name":{"kind":"Name","value":"isGenerating"}}]}}]}}]} as unknown as DocumentNode<StatusUpdateSubscription, StatusUpdateSubscriptionVariables>;
export const StopGenerationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"StopGeneration"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"stopGeneration"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}]}]}}]} as unknown as DocumentNode<StopGenerationMutation, StopGenerationMutationVariables>;
export const UpdateChartDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateChart"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"chartId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"title"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"spec"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateChart"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"chartId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"chartId"}}},{"kind":"Argument","name":{"kind":"Name","value":"title"},"value":{"kind":"Variable","name":{"kind":"Name","value":"title"}}},{"kind":"Argument","name":{"kind":"Name","value":"spec"},"value":{"kind":"Variable","name":{"kind":"Name","value":"spec"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"spec"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<UpdateChartMutation, UpdateChartMutationVariables>;