import { useEffect, useState } from "react";
import { useMutation } from "@apollo/client/react";
import {
  DeleteDataSourceDocument,
  GetProjectDataSourcesDocument,
} from "../../__generated__/graphql";
import { API_BASE_URL } from "../../config";
import { DataSourceDetailTabView } from "./DataSourceDetailTabView";

type PreviewData = {
  preview_rows: Record<string, unknown>[];
  describe_columns: string[];
  describe_rows: Record<string, unknown>[];
};

type Props = {
  dataSourceId: string;
  projectId: string;
  name: string;
  onDelete: () => void;
};

/**
 * DataSourceDetailTab is a component that displays the details of a data source.
 *
 * Set key={dataSourceId} to force a re-render when the data source ID changes.
 */
export function DataSourceDetailTab({ dataSourceId, projectId, name, onDelete }: Props) {
  const [status, setStatus] = useState<"loading" | "error" | "loaded">(
    "loading",
  );
  const [data, setData] = useState<PreviewData | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [deleteDataSource] = useMutation(DeleteDataSourceDocument, {
    refetchQueries: [{ query: GetProjectDataSourcesDocument, variables: { id: projectId } }],
  });

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/data-sources/${dataSourceId}/preview`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch preview");
        return res.json() as Promise<PreviewData>;
      })
      .then((json) => {
        setData(json);
        setStatus("loaded");
      })
      .catch(() => {
        setStatus("error");
      });
  }, [dataSourceId]);

  function handleDeleteClick() {
    setDeleteError(null);
    setShowDeleteModal(true);
  }

  async function handleDeleteConfirm() {
    setIsDeleting(true);
    try {
      await deleteDataSource({ variables: { dataSourceId } });
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

  return (
    <DataSourceDetailTabView
      name={name}
      status={status}
      data={data}
      showDeleteModal={showDeleteModal}
      isDeleting={isDeleting}
      deleteError={deleteError}
      onDeleteClick={handleDeleteClick}
      onDeleteConfirm={handleDeleteConfirm}
      onDeleteCancel={handleDeleteCancel}
    />
  );
}
