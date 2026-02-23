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
};

export function ProjectView({
  containerRef,
  leftPercent,
  onHandleMouseDown,
  projectId,
  projectName,
  onHome,
}: Props) {
  return (
    <div ref={containerRef} className="flex h-screen bg-base-100">
      <div style={{ width: `${leftPercent}%` }} className="h-full overflow-hidden">
        <ChatPanel projectId={projectId} projectName={projectName} onHome={onHome} />
      </div>

      <div
        onMouseDown={onHandleMouseDown}
        className="w-1 flex-shrink-0 cursor-col-resize bg-base-300 hover:bg-primary transition-colors"
      />

      <div style={{ width: `${100 - leftPercent}%` }} className="h-full overflow-hidden">
        <MainPanel />
      </div>
    </div>
  );
}
