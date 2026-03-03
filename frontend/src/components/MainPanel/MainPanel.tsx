import { useCallback, useEffect, useRef, useState } from "react";
import { useSubscription, useQuery } from "@apollo/client/react";
import { useMatch, useNavigate } from "react-router-dom";
import {
  ChartAddedDocument,
  ChartUpdatedDocument,
  GetProjectChartsDocument,
  GetProjectDataSourcesDocument,
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
  const chartRouteMatch = useMatch("/project/:projectId/chart/:chartId");
  const dataRouteMatch = useMatch("/project/:projectId/data/:dataSourceId");
  const urlChartId = chartRouteMatch?.params.chartId;
  const urlDataSourceId = dataRouteMatch?.params.dataSourceId;
  const navigate = useNavigate();

  const activeTabId = urlChartId
    ? `chart-${urlChartId}`
    : urlDataSourceId
    ? `ds-${urlDataSourceId}`
    : "overview";

  const [tabs, setTabs] = useState<AppTab[]>([
    { id: "overview", label: "Overview", closeable: false },
  ]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const nextNotificationId = useRef(0);
  const hasInitialized = useRef(false);
  const storageKey = `chart-chat-tabs-${projectId}`;

  const { data: chartsData } = useQuery(GetProjectChartsDocument, {
    variables: { id: projectId },
  });
  const { data: dataSourcesData } = useQuery(GetProjectDataSourcesDocument, {
    variables: { id: projectId },
  });

  useEffect(() => {
    const activeTab = tabs.find((t) => t.id === activeTabId);
    if (activeTab && "kind" in activeTab && activeTab.kind === "chart") {
      const chartId = activeTab.id.replace("chart-", "");
      onActiveChartChange(chartId);
    } else {
      onActiveChartChange(null);
    }
  }, [activeTabId, tabs, onActiveChartChange]);

  // Save open tabs to localStorage (after initialization)
  useEffect(() => {
    if (!hasInitialized.current) return;
    const ids = tabs.filter((t) => t.id !== "overview").map((t) => t.id);
    localStorage.setItem(storageKey, JSON.stringify(ids));
  }, [tabs, storageKey]);

  // Restore open tabs from localStorage (once, when data is available)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (hasInitialized.current) return;
    if (!chartsData || !dataSourcesData) return;
    hasInitialized.current = true;

    const persistedIds: string[] = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
    const idsToOpen = new Set(persistedIds);
    if (urlChartId) idsToOpen.add(`chart-${urlChartId}`);
    if (urlDataSourceId) idsToOpen.add(`ds-${urlDataSourceId}`);

    const charts = chartsData.project?.charts ?? [];
    const dataSources = dataSourcesData.project?.dataSources ?? [];

    const restoredTabs: AppTab[] = [
      { id: "overview", label: "Overview", closeable: false },
    ];

    for (const tabId of idsToOpen) {
      if (tabId.startsWith("chart-")) {
        const chart = charts.find((c) => `chart-${c.id}` === tabId);
        if (chart) {
          restoredTabs.push({
            kind: "chart",
            id: tabId,
            label: truncateLabel(chart.title),
            title: chart.title,
            spec: chart.spec,
            version: chart.version,
            closeable: true,
          });
        }
      } else if (tabId.startsWith("ds-")) {
        const ds = dataSources.find((d) => `ds-${d.id}` === tabId);
        if (ds) {
          restoredTabs.push({
            kind: "data-source",
            id: tabId,
            label: truncateLabel(ds.name),
            dataSourceId: ds.id,
            name: ds.name,
            closeable: true,
          });
        }
      }
    }

    setTabs(restoredTabs);
  }, [chartsData, dataSourcesData]);

  const showNotification = useCallback((message: string) => {
    const id = nextNotificationId.current++;
    setNotifications((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 3000);
  }, []);

  const navigateToTab = useCallback(
    (tabId: string) => {
      if (tabId === "overview") {
        navigate(`/project/${projectId}`);
      } else if (tabId.startsWith("chart-")) {
        navigate(`/project/${projectId}/chart/${tabId.replace("chart-", "")}`);
      } else if (tabId.startsWith("ds-")) {
        navigate(`/project/${projectId}/data/${tabId.replace("ds-", "")}`);
      }
    },
    [navigate, projectId],
  );

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
      navigateToTab(tabId);
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

  const openChartTab = useCallback(
    (chart: Chart) => {
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
      navigateToTab(tabId);
    },
    [navigateToTab],
  );

  const openDataSourceTab = useCallback(
    (ds: DataSource) => {
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
      navigateToTab(tabId);
    },
    [navigateToTab],
  );

  const closeTab = useCallback(
    (tabId: string) => {
      setTabs((prev) => {
        const idx = prev.findIndex((t) => t.id === tabId);
        const next = prev.filter((t) => t.id !== tabId);
        if (activeTabId === tabId) {
          const newActive = next[Math.max(0, idx - 1)];
          navigateToTab(newActive?.id ?? "overview");
        }
        return next;
      });
    },
    [activeTabId, navigateToTab],
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
      onTabChange={navigateToTab}
      onCloseTab={closeTab}
      onReorderTabs={reorderTabs}
      renderContent={renderContent}
    />
  );
}
