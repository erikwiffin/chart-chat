import { useCallback, useEffect, useRef, useState } from "react";
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

type Chart = { id: string; title: string; spec: string; version: number };
type DataSource = {
  id: string;
  name: string;
  sourceType: string;
  columns: string[];
  rowCount: number;
};

type Notification = { id: number; message: string };

export function MainPanel({ projectId, onActiveChartChange }: Props) {
  const [tabs, setTabs] = useState<AppTab[]>([
    { id: "overview", label: "Overview", closeable: false },
  ]);
  const [activeTabId, setActiveTabId] = useState("overview");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const nextNotificationId = useRef(0);

  useEffect(() => {
    const activeTab = tabs.find((t) => t.id === activeTabId);
    if (activeTab && "kind" in activeTab && activeTab.kind === "chart") {
      const chartId = activeTab.id.replace("chart-", "");
      onActiveChartChange(chartId);
    } else {
      onActiveChartChange(null);
    }
  }, [activeTabId, tabs, onActiveChartChange]);

  const showNotification = useCallback((message: string) => {
    const id = nextNotificationId.current++;
    setNotifications((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 3000);
  }, []);

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
          version: newChart.version,
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
              version: updatedChart.version,
              label: truncateLabel(updatedChart.title),
            };
          }
          return tab;
        }),
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
        version: chart.version,
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
    [activeTabId],
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
        return (
          <ChartDetailTab
            key={chartId}
            chartId={chartId}
            projectId={projectId}
            title={tab.title}
            spec={tab.spec}
            version={tab.version}
            onDelete={() => {
              closeTab(tab.id);
              showNotification("Chart deleted");
            }}
          />
        );
      }
      if ("kind" in tab && tab.kind === "data-source") {
        return (
          <DataSourceDetailTab
            key={tab.dataSourceId}
            dataSourceId={tab.dataSourceId}
            projectId={projectId}
            name={tab.name}
            onDelete={() => {
              closeTab(tab.id);
              showNotification("Data source deleted");
            }}
          />
        );
      }
      return null;
    },
    [projectId, openChartTab, openDataSourceTab, closeTab, showNotification],
  );

  return (
    <MainPanelView
      tabs={tabs}
      activeTabId={activeTabId}
      notifications={notifications}
      onTabChange={setActiveTabId}
      onCloseTab={closeTab}
      onReorderTabs={reorderTabs}
      renderContent={renderContent}
    />
  );
}
