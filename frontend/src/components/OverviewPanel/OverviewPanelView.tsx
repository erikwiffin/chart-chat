const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

type Chart = {
  id: string;
  title: string;
  spec: string;
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
  charts: Chart[];
  dataSources: DataSource[];
  onOpenChart: (chart: Chart) => void;
  onOpenDataSource: (ds: DataSource) => void;
};

export function OverviewPanelView({
  charts,
  dataSources,
  onOpenChart,
  onOpenDataSource,
}: Props) {
  const isEmpty = charts.length === 0 && dataSources.length === 0;

  if (isEmpty) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-base-content/50 text-sm text-center max-w-xs">
          Drop a CSV to add a data source, then ask the assistant to create a
          chart.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {dataSources.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-base-content/70 mb-2 uppercase tracking-wide">
            Data Sources
          </h2>
          <div className="flex flex-col gap-3">
            {dataSources.map((ds) => (
              <button
                key={ds.id}
                className="card bg-base-200 shadow text-left hover:bg-base-300 transition-colors"
                onClick={() => onOpenDataSource(ds)}
              >
                <div className="card-body py-3 px-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{ds.name}</span>
                    <span className="badge badge-ghost badge-sm">
                      {ds.rowCount} rows
                    </span>
                  </div>
                  <p className="text-xs text-base-content/60 truncate">
                    {ds.columns.join(", ")}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {charts.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-base-content/70 mb-2 uppercase tracking-wide">
            Charts
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {charts.map((chart) => (
              <button
                key={chart.id}
                className="card bg-base-200 shadow text-left hover:bg-base-300 transition-colors"
                onClick={() => onOpenChart(chart)}
              >
                {chart.thumbnailUrl && (
                  <figure>
                    <img
                      src={API_BASE_URL.replace(/\/$/, "") + chart.thumbnailUrl}
                      alt={chart.title}
                      className="w-full object-contain rounded-t"
                    />
                  </figure>
                )}
                <div className="card-body py-3 px-4">
                  <span className="font-medium text-sm">{chart.title}</span>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
