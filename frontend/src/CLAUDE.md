# frontend/src

This directory contains the React + TypeScript frontend source code.

## GraphQL Conventions

When writing mutations that alter data, always include `refetchQueries` to keep the Apollo cache in sync. Pass the relevant query document and its variables so all active query consumers update automatically after the mutation succeeds.

Example:

```ts
useMutation(DeleteChartDocument, {
  refetchQueries: [{ query: GetProjectChartsDocument, variables: { id: projectId } }],
});
```
