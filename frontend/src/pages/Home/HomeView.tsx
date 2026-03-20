import { useEffect, useLayoutEffect, useRef, useState } from "react";

type Project = { id: string; name: string };

function measureRecentGridHeights(
  grid: HTMLElement,
  firstRowCount: number,
): { firstRow: number; full: number } {
  const full = grid.scrollHeight;
  const children = [...grid.children] as HTMLElement[];
  const n = Math.min(firstRowCount, children.length);
  if (n === 0) return { firstRow: full, full };

  const gridTop = grid.getBoundingClientRect().top;
  let firstRowBottom = 0;
  for (let i = 0; i < n; i++) {
    const r = children[i].getBoundingClientRect();
    firstRowBottom = Math.max(firstRowBottom, r.bottom - gridTop);
  }
  return { firstRow: firstRowBottom, full };
}

/** Matches Tailwind `md:` (grid is `grid-cols-2 md:grid-cols-3`). */
function useMdUp() {
  const [isMdUp, setIsMdUp] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(min-width: 768px)").matches
      : false,
  );

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = () => setIsMdUp(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return isMdUp;
}

type Props = {
  input: string;
  onInputChange: (value: string) => void;
  file: File | null;
  onFileSelect: (file: File) => void;
  onFileClear: () => void;
  canSubmit: boolean;
  onSubmit: () => void;
  projects: Project[];
  onProjectSelect: (id: string) => void;
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
  const isMdUp = useMdUp();
  const [recentExpanded, setRecentExpanded] = useState(false);
  const firstRowCount = isMdUp ? 3 : 2;
  const hasMoreThanOneRow = projects.length > firstRowCount;
  const recentGridRef = useRef<HTMLDivElement>(null);
  const [recentClipHeights, setRecentClipHeights] = useState<{
    firstRow: number;
    full: number;
  } | null>(null);

  useLayoutEffect(() => {
    if (!hasMoreThanOneRow) return;
    const grid = recentGridRef.current;
    if (!grid) return;

    const update = () => {
      setRecentClipHeights(
        measureRecentGridHeights(grid, firstRowCount),
      );
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(grid);
    return () => ro.disconnect();
  }, [projects, firstRowCount, hasMoreThanOneRow]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (!selected.name.toLowerCase().endsWith(".csv")) return;
    onFileSelect(selected);
  };

  return (
    <div className="min-h-screen bg-base-100 flex flex-col items-center px-6 py-16">
      <div className="w-full max-w-2xl space-y-4">
        <h1 className="text-3xl font-bold text-center text-base-content">
          Chart Chat
        </h1>

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
            <p className="text-sm text-base-content/60">
              Add a CSV data file to continue.
            </p>
          )}
        </div>

        <button
          type="button"
          className="btn btn-primary w-full"
          onClick={onSubmit}
          disabled={!canSubmit}
        >
          {isCreating
            ? "Creating project…"
            : isUploading
              ? "Uploading data…"
              : "Start project"}
        </button>

        {uploadError && (
          <div className="alert alert-error">
            <span>{uploadError}</span>
          </div>
        )}
      </div>

      {projects.length > 0 && (
        <div className="w-full max-w-2xl mt-12">
          <h2 className="text-lg font-semibold text-base-content mb-4">
            Recent projects
          </h2>
          <div
            className={
              hasMoreThanOneRow
                ? "overflow-hidden transition-[max-height] duration-300 ease-out motion-reduce:transition-none"
                : undefined
            }
            style={
              hasMoreThanOneRow &&
              recentClipHeights &&
              recentClipHeights.full > 0
                ? {
                    maxHeight: recentExpanded
                      ? recentClipHeights.full
                      : recentClipHeights.firstRow,
                  }
                : undefined
            }
          >
            <div
              ref={recentGridRef}
              className="grid grid-cols-2 md:grid-cols-3 gap-4"
            >
              {projects.map((p) => (
                <div
                  key={p.id}
                  className="card bg-base-200 cursor-pointer hover:bg-base-300 transition-colors"
                  onClick={() => onProjectSelect(p.id)}
                >
                  <div className="card-body p-4">
                    <p className="font-medium text-base-content line-clamp-2">
                      {p.name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {hasMoreThanOneRow && (
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                className="btn btn-ghost btn-sm bg-base-200 hover:bg-base-300 flex-1"
                onClick={() => setRecentExpanded((v) => !v)}
              >
                {recentExpanded ? "See less" : "See more"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
