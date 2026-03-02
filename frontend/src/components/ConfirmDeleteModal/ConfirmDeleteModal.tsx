type Props = {
  isOpen: boolean;
  itemName: string;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDeleteModal({
  isOpen,
  itemName,
  isDeleting,
  onConfirm,
  onCancel,
}: Props) {
  if (!isOpen) return null;

  return (
    <dialog open className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg">Delete {itemName}?</h3>
        <p className="py-4 text-base-content/70">
          This action cannot be undone.
        </p>
        <div className="modal-action">
          <button className="btn btn-sm" onClick={onCancel} disabled={isDeleting}>
            Cancel
          </button>
          <button
            className="btn btn-sm btn-error"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onCancel} />
    </dialog>
  );
}
