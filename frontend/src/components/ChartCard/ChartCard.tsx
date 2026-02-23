import { useEffect, useRef } from "react";
import embed from "vega-embed";

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
      const parsedSpec = JSON.parse(spec);
      embed(containerRef.current, parsedSpec, { actions: false }).then(
        (result) => {
          view = result.view;
        }
      );
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
        <div ref={containerRef} />
      </div>
    </div>
  );
}
