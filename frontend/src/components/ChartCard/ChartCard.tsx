import { useEffect, useRef } from "react";
import embed, { type VisualizationSpec } from "vega-embed";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

type Props = {
  title: string;
  spec: string;
};

export function ChartCard({ title, spec }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let view: { finalize: () => void } | null = null;

    try {
      const parsedSpec = JSON.parse(spec) as Record<string, unknown> & {
        data?: { url?: string };
      };
      const dataUrl = parsedSpec.data?.url;
      if (typeof dataUrl === "string" && dataUrl.startsWith("/")) {
        parsedSpec.data = {
          ...parsedSpec.data,
          url: API_BASE_URL.replace(/\/$/, "") + dataUrl,
        };
      }
      embed(containerRef.current, parsedSpec as VisualizationSpec, {
        actions: false,
      }).then((result) => {
        view = result.view;
      });
    } catch (e) {
      console.error("Failed to render chart", e);
    }

    return () => {
      view?.finalize();
    };
  }, [spec]);

  return (
    <div className="card bg-base-200 shadow mb-4">
      <div className="card-body">
        <h3 className="card-title text-sm">{title}</h3>
        <div className="h-96 w-full">
          <div ref={containerRef} className="h-full w-full" />
        </div>
      </div>
    </div>
  );
}
