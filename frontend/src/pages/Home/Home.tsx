import { useCallback, useRef, useState } from "react";
import { HomeView } from "./HomeView";

const DEFAULT_LEFT_PERCENT = 33;
const MIN_LEFT_PERCENT = 15;
const MAX_LEFT_PERCENT = 80;

export function Home() {
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
    <HomeView
      containerRef={containerRef}
      leftPercent={leftPercent}
      onHandleMouseDown={onHandleMouseDown}
    />
  );
}
