type SpendData = {
  totalCost: number;
  totalRequests: number;
  totalTokens: number;
};

type Props = {
  data: SpendData | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
};

export function SpendPanelView({ data, loading, error, onRetry }: Props) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error">
        <span>{error}</span>
        <button className="btn btn-sm" onClick={onRetry}>
          Retry
        </button>
      </div>
    );
  }

  if (!data || data.totalRequests === 0) {
    return (
      <div className="text-center text-base-content/60 py-16">
        <p className="text-lg">No spend data yet</p>
        <p className="text-sm mt-2">
          LLM costs will appear here as you use the project.
        </p>
      </div>
    );
  }

  return (
    <div className="stats shadow">
      <div className="stat">
        <div className="stat-title">Total Spend</div>
        <div className="stat-value text-primary">
          ${data.totalCost.toFixed(4)}
        </div>
      </div>
      <div className="stat">
        <div className="stat-title">Requests</div>
        <div className="stat-value">{data.totalRequests}</div>
      </div>
      <div className="stat">
        <div className="stat-title">Tokens</div>
        <div className="stat-value">{data.totalTokens.toLocaleString()}</div>
      </div>
    </div>
  );
}
