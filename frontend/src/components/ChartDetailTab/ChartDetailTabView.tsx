import { ChartCard } from "../ChartCard/ChartCard";
import { ChartSpecEditor } from "../ChartSpecEditor/ChartSpecEditor";
import { ConfirmDeleteModal } from "../ConfirmDeleteModal/ConfirmDeleteModal";

type Revision = {
  id: string;
  version: number;
  spec: string;
  createdAt: string;
};

type Props = {
  title: string;
  editTitle: string;
  committedSpec: string;
  editSpec: string;
  mode: "view" | "edit";
  validationError: string | null;
  isSaving: boolean;
  showDeleteModal: boolean;
  isDeleting: boolean;
  deleteError: string | null;
  revisions: Revision[];
  currentVersion: number;
  previewVersion: number | null;
  previewSpec: string | null;
  isReverting: boolean;
  onEdit: () => void;
  onTitleChange: (newTitle: string) => void;
  onSpecChange: (newSpec: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onPrettify: () => void;
  onDeleteClick: () => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
  onVersionSelect: (version: number | null) => void;
  onRevert: () => void;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "numeric",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ChartDetailTabView({
  title,
  editTitle,
  committedSpec,
  editSpec,
  mode,
  validationError,
  isSaving,
  showDeleteModal,
  isDeleting,
  deleteError,
  revisions,
  currentVersion,
  previewVersion,
  previewSpec,
  isReverting,
  onEdit,
  onTitleChange,
  onSpecChange,
  onSave,
  onCancel,
  onPrettify,
  onDeleteClick,
  onDeleteConfirm,
  onDeleteCancel,
  onVersionSelect,
  onRevert,
}: Props) {
  const displaySpec = previewSpec ?? committedSpec;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-base-300 shrink-0">
        <span className="font-medium text-sm flex-1 truncate">{title}</span>
        {mode === "view" && (
          <>
            {revisions.length > 0 && (
              <select
                className="select select-sm select-bordered"
                value={previewVersion ?? currentVersion}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  onVersionSelect(v === currentVersion ? null : v);
                }}
              >
                {revisions.map((r) => (
                  <option key={r.id} value={r.version}>
                    v{r.version}
                    {r.version === currentVersion ? " (current)" : ""}
                    {" — "}
                    {formatDate(r.createdAt)}
                  </option>
                ))}
              </select>
            )}
            {previewVersion !== null && previewVersion !== currentVersion && (
              <button
                className="btn btn-sm btn-primary"
                onClick={onRevert}
                disabled={isReverting}
              >
                {isReverting ? "Reverting..." : `Revert to v${previewVersion}`}
              </button>
            )}
            <button
              className="btn btn-sm btn-ghost"
              onClick={onEdit}
              disabled={isSaving}
              title="Edit spec"
            >
              Edit
            </button>
            <button
              className="btn btn-sm btn-error btn-ghost"
              onClick={onDeleteClick}
              title="Delete chart"
            >
              Delete
            </button>
          </>
        )}
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
      {deleteError && (
        <div role="alert" className="alert alert-error mx-4 mt-2">
          <span>{deleteError}</span>
        </div>
      )}
      <div className="flex-1 overflow-auto p-4">
        {mode === "view" ? (
          <ChartCard title={title} spec={displaySpec} />
        ) : (
          <>
            <input
              type="text"
              className="input input-sm w-full"
              value={editTitle}
              onChange={(e) => onTitleChange(e.target.value)}
            />
            <ChartSpecEditor
              value={editSpec}
              onChange={onSpecChange}
              validationError={validationError}
            />
          </>
        )}
      </div>
      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        itemName={title}
        isDeleting={isDeleting}
        onConfirm={onDeleteConfirm}
        onCancel={onDeleteCancel}
      />
    </div>
  );
}
