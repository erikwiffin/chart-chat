import { useQuery } from "@apollo/client/react";
import { GetProjectSpendDocument } from "../../__generated__/graphql";
import { SpendPanelView } from "./SpendPanelView";

type Props = {
  projectId: string;
};

export function SpendPanel({ projectId }: Props) {
  const { data, loading, error, refetch } = useQuery(
    GetProjectSpendDocument,
    { variables: { projectId } },
  );

  return (
    <SpendPanelView
      data={data?.projectSpend ?? null}
      loading={loading}
      error={error?.message ?? null}
      onRetry={() => refetch()}
    />
  );
}
