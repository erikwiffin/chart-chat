import { ChartCard } from "../ChartCard/ChartCard";
import { ChartSpecEditor } from "../ChartSpecEditor/ChartSpecEditor";
import { ConfirmDeleteModal } from "../ConfirmDeleteModal/ConfirmDeleteModal";

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
  onEdit: () => void;
  onTitleChange: (newTitle: string) => void;
  onSpecChange: (newSpec: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onPrettify: () => void;
  onDeleteClick: () => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
};

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
  onEdit,
  onTitleChange,
  onSpecChange,
  onSave,
  onCancel,
  onPrettify,
  onDeleteClick,
  onDeleteConfirm,
  onDeleteCancel,
}: Props) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-base-300 shrink-0">
        <span className="font-medium text-sm flex-1 truncate">{title}</span>
        {mode === "view" && (
          <>
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
          <ChartCard title={title} spec={committedSpec} />
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
