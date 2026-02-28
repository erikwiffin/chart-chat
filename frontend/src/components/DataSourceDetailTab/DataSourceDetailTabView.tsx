type PreviewData = {
  preview_rows: Record<string, unknown>[];
  describe_columns: string[];
  describe_rows: Record<string, unknown>[];
};

type Props = {
  name: string;
  status: "loading" | "error" | "loaded";
  data: PreviewData | null;
};

export function DataSourceDetailTabView({ name, status, data }: Props) {
  if (status === "loading") {
    return (
      <div className="flex justify-center items-center h-32">
        <span className="loading loading-spinner loading-md" />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div role="alert" className="alert alert-error">
        <span>Failed to load preview.</span>
      </div>
    );
  }

  if (!data) return null;

  const { preview_rows, describe_columns, describe_rows } = data;
  const previewHeaders =
    preview_rows.length > 0 ? Object.keys(preview_rows[0]) : [];

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-base font-semibold">{name}</h2>

      {preview_rows.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-base-content/70 mb-2 uppercase tracking-wide">
            Preview (first 10 rows)
          </h3>
          <div className="overflow-x-auto">
            <table className="table table-xs table-zebra">
              <thead>
                <tr>
                  {previewHeaders.map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview_rows.map((row, i) => (
                  <tr key={i}>
                    {previewHeaders.map((h) => (
                      <td key={h}>{String(row[h] ?? "")}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {describe_rows.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-base-content/70 mb-2 uppercase tracking-wide">
            Summary statistics
          </h3>
          <div className="overflow-x-auto">
            <table className="table table-xs table-zebra">
              <thead>
                <tr>
                  <th>Statistic</th>
                  {describe_columns.map((c) => (
                    <th key={c}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {describe_rows.map((row, i) => (
                  <tr key={i}>
                    <td>
                      <strong>{String(row._stat ?? "")}</strong>
                    </td>
                    {describe_columns.map((c) => (
                      <td key={c}>{row[c] == null ? "" : String(row[c])}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
