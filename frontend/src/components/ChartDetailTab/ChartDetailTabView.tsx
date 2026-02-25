import { ChartCard } from "../ChartCard/ChartCard";
import { ChartSpecEditor } from "../ChartSpecEditor/ChartSpecEditor";

type Props = {
  title: string;
  committedSpec: string;
  editSpec: string;
  mode: "view" | "edit";
  validationError: string | null;
  isSaving: boolean;
  onToggleMode: () => void;
  onSpecChange: (newSpec: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onPrettify: () => void;
};

export function ChartDetailTabView({
  title,
  committedSpec,
  editSpec,
  mode,
  validationError,
  isSaving,
  onToggleMode,
  onSpecChange,
  onSave,
  onCancel,
  onPrettify,
}: Props) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-base-300 shrink-0">
        <span className="font-medium text-sm flex-1 truncate">{title}</span>
        <button
          className={`btn btn-sm ${mode === "edit" ? "btn-active" : "btn-ghost"}`}
          onClick={onToggleMode}
          title={mode === "edit" ? "View chart" : "Edit spec"}
        >
          {mode === "edit" ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          )}
        </button>
        {mode === "edit" && (
          <>
            <button
              className="btn btn-sm btn-ghost"
              onClick={onPrettify}
              disabled={isSaving}
              title="Prettify JSON"
            >
              Prettify
            </button>
            <button
              className="btn btn-sm btn-ghost"
              onClick={onCancel}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              className="btn btn-sm btn-primary"
              onClick={onSave}
              disabled={validationError !== null || isSaving}
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </>
        )}
      </div>
      <div className="flex-1 overflow-auto p-4">
        {mode === "view" ? (
          <ChartCard title={title} spec={committedSpec} />
        ) : (
          <ChartSpecEditor
            value={editSpec}
            onChange={onSpecChange}
            validationError={validationError}
          />
        )}
      </div>
    </div>
  );
}
