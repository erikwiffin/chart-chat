export type OverviewTab = {
  id: "overview";
  label: string;
  closeable: false;
};

export type ChartTab = {
  kind: "chart";
  id: string;
  label: string;
  title: string;
  spec: string;
  version: number;
  closeable: true;
};

export type DataSourceTab = {
  kind: "data-source";
  id: string;
  label: string;
  dataSourceId: string;
  name: string;
  closeable: true;
};

export type AppTab = OverviewTab | ChartTab | DataSourceTab;

export function truncateLabel(s: string): string {
  return s.length > 20 ? s.slice(0, 20) + "…" : s;
}
