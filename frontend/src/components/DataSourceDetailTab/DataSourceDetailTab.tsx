import { useEffect, useState } from "react";
import { DataSourceDetailTabView } from "./DataSourceDetailTabView";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

type PreviewData = {
  preview_rows: Record<string, unknown>[];
  describe_columns: string[];
  describe_rows: Record<string, unknown>[];
};

type Props = {
  dataSourceId: string;
  name: string;
};

export function DataSourceDetailTab({ dataSourceId, name }: Props) {
  const [status, setStatus] = useState<"loading" | "error" | "loaded">("loading");
  const [data, setData] = useState<PreviewData | null>(null);

  useEffect(() => {
    setStatus("loading");
    setData(null);

    fetch(`${API_BASE_URL}/api/data-sources/${dataSourceId}/preview`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch preview");
        return res.json() as Promise<PreviewData>;
      })
      .then((json) => {
        setData(json);
        setStatus("loaded");
      })
      .catch(() => {
        setStatus("error");
      });
  }, [dataSourceId]);

  return <DataSourceDetailTabView name={name} status={status} data={data} />;
}
