import { useEffect } from "react";
import { useQuery } from "@apollo/client/react";
import type { GetProjectChartsQuery } from "../../__generated__/graphql";
import {
  ChartAddedDocument,
  ChartDeletedDocument,
  GetProjectChartsDocument,
  GetProjectDataSourcesDocument,
} from "../../__generated__/graphql";
import { OverviewPanelView } from "./OverviewPanelView";

type Chart = {
  id: string;
  title: string;
  spec: string;
  version: number;
  thumbnailUrl?: string | null;
};

type DataSource = {
  id: string;
  name: string;
  sourceType: string;
  columns: string[];
  rowCount: number;
};

type Props = {
  projectId: string;
  onOpenChart: (chart: Chart) => void;
  onOpenDataSource: (ds: DataSource) => void;
};

export function OverviewPanel({ projectId, onOpenChart, onOpenDataSource }: Props) {
  const { data: chartsData, subscribeToMore } = useQuery(GetProjectChartsDocument, {
    variables: { id: projectId },
  });

  useEffect(() => {
    const unsubAdd = subscribeToMore({
      document: ChartAddedDocument,
      variables: { projectId },
      updateQuery: (prev, { subscriptionData }): GetProjectChartsQuery => {
        const newChart = subscriptionData.data?.chartAdded;
        if (!newChart || !prev.project) return prev as GetProjectChartsQuery;
        const existing = prev.project.charts ?? [];
        if (existing.some((c) => c.id === newChart.id))
          return prev as GetProjectChartsQuery;
        return {
          ...prev,
          project: {
            ...prev.project,
            charts: [...existing, newChart],
          },
        } as GetProjectChartsQuery;
      },
    });

    const unsubDelete = subscribeToMore({
      document: ChartDeletedDocument,
      variables: { projectId },
      updateQuery: (prev, { subscriptionData }): GetProjectChartsQuery => {
        const event = subscriptionData.data?.chartDeleted;
        if (!event || !prev.project) return prev as GetProjectChartsQuery;
        const existing = prev.project.charts ?? [];
        return {
          ...prev,
          project: {
            ...prev.project,
            charts: existing.filter((c) => c.id !== event.id),
          },
        } as GetProjectChartsQuery;
      },
    });

    return () => {
      unsubAdd();
      unsubDelete();
    };
  }, [projectId, subscribeToMore]);

  const { data: dsData } = useQuery(GetProjectDataSourcesDocument, {
    variables: { id: projectId },
  });

  const charts = chartsData?.project?.charts ?? [];
  const dataSources = dsData?.project?.dataSources ?? [];

  return (
    <OverviewPanelView
      charts={charts}
      dataSources={dataSources}
      onOpenChart={onOpenChart}
      onOpenDataSource={onOpenDataSource}
    />
  );
}
