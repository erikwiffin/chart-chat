import { useCallback, useEffect, useState } from "react";
import { useSubscription } from "@apollo/client/react";
import {
  ChartAddedDocument,
  ChartUpdatedDocument,
} from "../../__generated__/graphql";
import { ChartDetailTab } from "../ChartDetailTab/ChartDetailTab";
import { DataSourceDetailTab } from "../DataSourceDetailTab/DataSourceDetailTab";
import { OverviewPanel } from "../OverviewPanel/OverviewPanel";
import type { AppTab, ChartTab, DataSourceTab } from "./tabs";
import { truncateLabel } from "./tabs";
import { MainPanelView } from "./MainPanelView";

type Props = {
  projectId: string;
  onActiveChartChange: (chartId: string | null) => void;
};

type Chart = { id: string; title: string; spec: string };
type DataSource = { id: string; name: string; sourceType: string; columns: string[]; rowCount: number };

export function MainPanel({ projectId, onActiveChartChange }: Props) {
  const [tabs, setTabs] = useState<AppTab[]>([
    { id: "overview", label: "Overview", closeable: false },
  ]);
  const [activeTabId, setActiveTabId] = useState("overview");

  useEffect(() => {
    const activeTab = tabs.find((t) => t.id === activeTabId);
    if (activeTab && "kind" in activeTab && activeTab.kind === "chart") {
      const chartId = activeTab.id.replace("chart-", "");
      onActiveChartChange(chartId);
    } else {
      onActiveChartChange(null);
    }
  }, [activeTabId, tabs, onActiveChartChange]);

  useSubscription(ChartAddedDocument, {
    variables: { projectId },
    onData: ({ data }) => {
      const newChart = data.data?.chartAdded;
      if (!newChart) return;
      const tabId = `chart-${newChart.id}`;
      setTabs((prev) => {
        if (prev.some((t) => t.id === tabId)) return prev;
        const newTab: ChartTab = {
          kind: "chart",
          id: tabId,
          label: truncateLabel(newChart.title),
          title: newChart.title,
          spec: newChart.spec,
          closeable: true,
        };
        return [...prev, newTab];
      });
      setActiveTabId(tabId);
    },
  });

  useSubscription(ChartUpdatedDocument, {
    variables: { projectId },
    onData: ({ data }) => {
      const updatedChart = data.data?.chartUpdated;
      if (!updatedChart) return;
      const tabId = `chart-${updatedChart.id}`;
      setTabs((prev) =>
        prev.map((tab) => {
          if (tab.id === tabId && "kind" in tab && tab.kind === "chart") {
            return {
              ...tab,
              spec: updatedChart.spec,
              title: updatedChart.title,
              label: truncateLabel(updatedChart.title),
            };
          }
          return tab;
        })
      );
    },
  });

  const openChartTab = useCallback((chart: Chart) => {
    const tabId = `chart-${chart.id}`;
    setTabs((prev) => {
      if (prev.some((t) => t.id === tabId)) return prev;
      const newTab: ChartTab = {
        kind: "chart",
        id: tabId,
        label: truncateLabel(chart.title),
        title: chart.title,
        spec: chart.spec,
        closeable: true,
      };
      return [...prev, newTab];
    });
    setActiveTabId(tabId);
  }, []);

  const openDataSourceTab = useCallback((ds: DataSource) => {
    const tabId = `ds-${ds.id}`;
    setTabs((prev) => {
      if (prev.some((t) => t.id === tabId)) return prev;
      const newTab: DataSourceTab = {
        kind: "data-source",
        id: tabId,
        label: truncateLabel(ds.name),
        dataSourceId: ds.id,
        name: ds.name,
        closeable: true,
      };
      return [...prev, newTab];
    });
    setActiveTabId(tabId);
  }, []);

  const closeTab = useCallback(
    (tabId: string) => {
      setTabs((prev) => {
        const idx = prev.findIndex((t) => t.id === tabId);
        const next = prev.filter((t) => t.id !== tabId);
        if (activeTabId === tabId) {
          const newActive = next[Math.max(0, idx - 1)];
          setActiveTabId(newActive?.id ?? "overview");
        }
        return next;
      });
    },
    [activeTabId]
  );

  const reorderTabs = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === 0 || toIndex === 0) return;
    setTabs((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }, []);

  const renderContent = useCallback(
    (tab: AppTab) => {
      if (tab.id === "overview") {
        return (
          <OverviewPanel
            projectId={projectId}
            onOpenChart={openChartTab}
            onOpenDataSource={openDataSourceTab}
          />
        );
      }
      if ("kind" in tab && tab.kind === "chart") {
        const chartId = tab.id.replace("chart-", "");
        return <ChartDetailTab chartId={chartId} title={tab.title} spec={tab.spec} />;
      }
      if ("kind" in tab && tab.kind === "data-source") {
        return (
          <DataSourceDetailTab
            dataSourceId={tab.dataSourceId}
            name={tab.name}
          />
        );
      }
      return null;
    },
    [projectId, openChartTab, openDataSourceTab]
  );

  return (
    <MainPanelView
      tabs={tabs}
      activeTabId={activeTabId}
      onTabChange={setActiveTabId}
      onCloseTab={closeTab}
      onReorderTabs={reorderTabs}
      renderContent={renderContent}
    />
  );
}
