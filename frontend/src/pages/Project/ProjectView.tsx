import type { RefObject } from "react";
import { ChatPanel } from "../../components/ChatPanel";
import { MainPanel } from "../../components/MainPanel";

type Props = {
  containerRef: RefObject<HTMLDivElement | null>;
  leftPercent: number;
  onHandleMouseDown: (e: React.MouseEvent) => void;
  projectId: string;
  projectName: string;
  onHome: () => void;
  isDragging: boolean;
  uploadStatus: "idle" | "success" | "error";
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  activeChartId: string | null;
  onActiveChartChange: (id: string | null) => void;
};

export function ProjectView({
  containerRef,
  leftPercent,
  onHandleMouseDown,
  projectId,
  projectName,
  onHome,
  isDragging,
  uploadStatus,
  onDragOver,
  onDragLeave,
  onDrop,
  activeChartId,
  onActiveChartChange,
}: Props) {
  return (
    <div
      ref={containerRef}
      className="flex h-screen bg-base-100 relative"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-base-100/80 flex items-center justify-center pointer-events-none">
          <div className="border-4 border-dashed border-primary rounded-xl p-16 text-primary text-xl font-semibold">
            Drop CSV to upload
          </div>
        </div>
      )}

      {uploadStatus === "success" && (
        <div className="absolute top-4 right-4 z-50 alert alert-success shadow-lg w-auto">
          <span>Data source added!</span>
        </div>
      )}

      {uploadStatus === "error" && (
        <div className="absolute top-4 right-4 z-50 alert alert-error shadow-lg w-auto">
          <span>Upload failed. Please try again.</span>
        </div>
      )}

      <div style={{ width: `${leftPercent}%` }} className="h-full overflow-hidden">
        <ChatPanel
          projectId={projectId}
          projectName={projectName}
          onHome={onHome}
          activeChartId={activeChartId}
        />
      </div>

      <div
        onMouseDown={onHandleMouseDown}
        className="w-1 flex-shrink-0 cursor-col-resize bg-base-300 hover:bg-primary transition-colors"
      />

      <div style={{ width: `${100 - leftPercent}%` }} className="h-full overflow-hidden">
        <MainPanel projectId={projectId} onActiveChartChange={onActiveChartChange} />
      </div>
    </div>
  );
}
