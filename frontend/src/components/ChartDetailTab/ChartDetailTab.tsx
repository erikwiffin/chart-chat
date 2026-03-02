import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { compile } from "vega-lite";
import {
  DeleteChartDocument,
  GetChartRevisionsDocument,
  GetProjectChartsDocument,
  RevertChartDocument,
  UpdateChartDocument,
} from "../../__generated__/graphql";
import { ChartDetailTabView } from "./ChartDetailTabView";

type Props = {
  chartId: string;
  projectId: string;
  title: string;
  spec: string;
  version: number;
  onDelete: () => void;
};

export function ChartDetailTab({ chartId, projectId, title, spec, version, onDelete }: Props) {
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [editTitle, setEditTitle] = useState(title);
  const [editSpec, setEditSpec] = useState(
    JSON.stringify(JSON.parse(spec), null, 4),
  );
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [previewVersion, setPreviewVersion] = useState<number | null>(null);

  const { data: revisionsData } = useQuery(GetChartRevisionsDocument, {
    variables: { chartId },
  });
  const revisions = revisionsData?.chartRevisions ?? [];

  const previewSpec = previewVersion !== null
    ? revisions.find((r) => r.version === previewVersion)?.spec ?? null
    : null;

  const [updateChart, { loading: isSaving }] = useMutation(UpdateChartDocument);
  const [deleteChart] = useMutation(DeleteChartDocument, {
    refetchQueries: [{ query: GetProjectChartsDocument, variables: { id: projectId } }],
  });
  const [revertChart, { loading: isReverting }] = useMutation(RevertChartDocument, {
    refetchQueries: [{ query: GetChartRevisionsDocument, variables: { chartId } }],
  });

  function validate(value: string): string | null {
    try {
      const parsed = JSON.parse(value);
      compile(parsed);
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : String(e);
    }
  }

  function handleTitleChange(newValue: string) {
    setEditTitle(newValue);
  }

  function handleSpecChange(newValue: string) {
    setEditSpec(newValue);
    setValidationError(validate(newValue));
  }

  function handleEdit() {
    setMode("edit");
  }

  async function handleSave() {
    const error = validate(editSpec);
    if (error) {
      setValidationError(error);
      return;
    }
    await updateChart({
      variables: { chartId, title: editTitle, spec: editSpec },
    });
    setMode("view");
  }

  function handleCancel() {
    setMode("view");
    setEditSpec(spec);
    setValidationError(null);
  }

  function handlePrettify() {
    try {
      const prettified = JSON.stringify(JSON.parse(editSpec), null, 4);
      handleSpecChange(prettified);
    } catch {
      // invalid JSON — do nothing
    }
  }

  function handleDeleteClick() {
    setDeleteError(null);
    setShowDeleteModal(true);
  }

  async function handleDeleteConfirm() {
    setIsDeleting(true);
    try {
      await deleteChart({ variables: { chartId } });
      onDelete();
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : String(e));
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  }

  function handleDeleteCancel() {
    setShowDeleteModal(false);
  }

  function handleVersionSelect(v: number | null) {
    setPreviewVersion(v);
  }

  async function handleRevert() {
    if (previewVersion === null) return;
    await revertChart({
      variables: { chartId, version: previewVersion },
    });
    setPreviewVersion(null);
  }

  return (
    <ChartDetailTabView
      title={title}
      editTitle={editTitle}
      committedSpec={spec}
      editSpec={editSpec}
      mode={mode}
      validationError={validationError}
      isSaving={isSaving}
      showDeleteModal={showDeleteModal}
      isDeleting={isDeleting}
      deleteError={deleteError}
      revisions={revisions}
      currentVersion={version}
      previewVersion={previewVersion}
      previewSpec={previewSpec}
      isReverting={isReverting}
      onEdit={handleEdit}
      onTitleChange={handleTitleChange}
      onSpecChange={handleSpecChange}
      onSave={handleSave}
      onCancel={handleCancel}
      onPrettify={handlePrettify}
      onDeleteClick={handleDeleteClick}
      onDeleteConfirm={handleDeleteConfirm}
      onDeleteCancel={handleDeleteCancel}
      onVersionSelect={handleVersionSelect}
      onRevert={handleRevert}
    />
  );
}
