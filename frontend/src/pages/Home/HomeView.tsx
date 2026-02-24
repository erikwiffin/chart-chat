type Project = { id: string; name: string };

type Props = {
  input: string;
  onInputChange: (value: string) => void;
  file: File | null;
  onFileSelect: (file: File) => void;
  onFileClear: () => void;
  canSubmit: boolean;
  onSubmit: () => void;
  projects: Project[];
  onProjectSelect: (id: string, name: string) => void;
  isCreating: boolean;
  isUploading: boolean;
  uploadError: string | null;
};

export function HomeView({
  input,
  onInputChange,
  file,
  onFileSelect,
  onFileClear,
  canSubmit,
  onSubmit,
  projects,
  onProjectSelect,
  isCreating,
  isUploading,
  uploadError,
}: Props) {
  const isBusy = isCreating || isUploading;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (!selected.name.toLowerCase().endsWith(".csv")) return;
    onFileSelect(selected);
  };

  return (
    <div className="min-h-screen bg-base-100 flex flex-col items-center px-6 py-16">
      <div className="w-full max-w-2xl space-y-4">
        <h1 className="text-3xl font-bold text-center text-base-content">Chart Chat</h1>

        <textarea
          className="textarea w-full resize-none text-base"
          placeholder="What do you want to explore?"
          rows={4}
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          disabled={isBusy}
        />

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="file-input file-input-bordered file-input-sm w-full max-w-xs"
              disabled={isBusy}
            />
            {file && (
              <span className="text-sm text-base-content/80 flex items-center gap-2">
                {file.name}
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  onClick={onFileClear}
                  disabled={isBusy}
                >
                  Remove
                </button>
              </span>
            )}
          </div>
          {!file && (
            <p className="text-sm text-base-content/60">Add a CSV data file to continue.</p>
          )}
        </div>

        <button
          type="button"
          className="btn btn-primary w-full"
          onClick={onSubmit}
          disabled={!canSubmit}
        >
          {isCreating ? "Creating project…" : isUploading ? "Uploading data…" : "Start project"}
        </button>

        {uploadError && (
          <div className="alert alert-error">
            <span>{uploadError}</span>
          </div>
        )}
      </div>

      {projects.length > 0 && (
        <div className="w-full max-w-2xl mt-12">
          <h2 className="text-lg font-semibold text-base-content mb-4">Recent projects</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {projects.map((p) => (
              <div
                key={p.id}
                className="card bg-base-200 cursor-pointer hover:bg-base-300 transition-colors"
                onClick={() => onProjectSelect(p.id, p.name)}
              >
                <div className="card-body p-4">
                  <p className="font-medium text-base-content line-clamp-2">{p.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
