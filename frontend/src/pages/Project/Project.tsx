import { useApolloClient, useQuery } from "@apollo/client/react";
import { useCallback, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { GetProjectDocument } from "../../__generated__/graphql";
import { API_BASE_URL } from "../../config";
import { ProjectView } from "./ProjectView";

const DEFAULT_LEFT_PERCENT = 33;
const MIN_LEFT_PERCENT = 15;
const MAX_LEFT_PERCENT = 80;

export function Project() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { data } = useQuery(GetProjectDocument, {
    variables: { id: projectId! },
  });

  const [leftPercent, setLeftPercent] = useState(DEFAULT_LEFT_PERCENT);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [activeChartId, setActiveChartId] = useState<string | null>(null);
  const client = useApolloClient();

  const onHandleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();

    const onMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const percent = ((e.clientX - rect.left) / rect.width) * 100;
      setLeftPercent(
        Math.min(MAX_LEFT_PERCENT, Math.max(MIN_LEFT_PERCENT, percent)),
      );
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes("Files")) return;
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Only clear if leaving the container entirely
    if (!containerRef.current?.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (!file) return;

      if (!file.name.toLowerCase().endsWith(".csv")) {
        setUploadStatus("error");
        setTimeout(() => setUploadStatus("idle"), 3000);
        return;
      }

      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/projects/${projectId}/upload`,
          { method: "POST", body: formData },
        );

        if (!response.ok) {
          throw new Error("Upload failed");
        }

        setUploadStatus("success");
        setTimeout(() => setUploadStatus("idle"), 3000);
        await client.refetchQueries({ include: ["GetProjectDataSources"] });
      } catch {
        setUploadStatus("error");
        setTimeout(() => setUploadStatus("idle"), 3000);
      }
    },
    [projectId, client],
  );

  if (!data || !data.project) return <div>Loading...</div>;

  return (
    <ProjectView
      containerRef={containerRef}
      leftPercent={leftPercent}
      onHandleMouseDown={onHandleMouseDown}
      projectId={projectId!}
      projectName={data.project.name}
      onHome={() => navigate("/")}
      isDragging={isDragging}
      uploadStatus={uploadStatus}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      activeChartId={activeChartId}
      onActiveChartChange={setActiveChartId}
    />
  );
}
