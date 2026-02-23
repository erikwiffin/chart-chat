import { useCallback, useRef, useState } from "react";
import { ProjectView } from "./ProjectView";

const DEFAULT_LEFT_PERCENT = 33;
const MIN_LEFT_PERCENT = 15;
const MAX_LEFT_PERCENT = 80;

type Props = {
  projectId: string;
  projectName: string;
  onHome: () => void;
};

export function Project({ projectId, projectName, onHome }: Props) {
  const [leftPercent, setLeftPercent] = useState(DEFAULT_LEFT_PERCENT);
  const containerRef = useRef<HTMLDivElement>(null);

  const onHandleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();

    const onMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const percent = ((e.clientX - rect.left) / rect.width) * 100;
      setLeftPercent(Math.min(MAX_LEFT_PERCENT, Math.max(MIN_LEFT_PERCENT, percent)));
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }, []);

  return (
    <ProjectView
      containerRef={containerRef}
      leftPercent={leftPercent}
      onHandleMouseDown={onHandleMouseDown}
      projectId={projectId}
      projectName={projectName}
      onHome={onHome}
    />
  );
}
