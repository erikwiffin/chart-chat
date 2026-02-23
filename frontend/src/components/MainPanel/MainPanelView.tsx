import { useRef } from "react";
import type { ReactNode } from "react";
import type { AppTab } from "./tabs";

type Props = {
  tabs: AppTab[];
  activeTabId: string;
  onTabChange: (id: string) => void;
  onCloseTab: (id: string) => void;
  onReorderTabs: (fromIndex: number, toIndex: number) => void;
  renderContent: (tab: AppTab) => ReactNode;
};

export function MainPanelView({
  tabs,
  activeTabId,
  onTabChange,
  onCloseTab,
  onReorderTabs,
  renderContent,
}: Props) {
  const dragIndexRef = useRef<number | null>(null);
  const activeTab = tabs.find((t) => t.id === activeTabId);

  return (
    <div className="flex flex-col h-full">
      <div role="tablist" className="tabs tabs-lift px-4 pt-2">
        {tabs.map((tab, index) => (
          <a
            key={tab.id}
            role="tab"
            className={`tab group ${activeTabId === tab.id ? "tab-active" : ""}`}
            onClick={() => onTabChange(tab.id)}
            draggable={tab.id !== "overview"}
            onDragStart={
              tab.id !== "overview"
                ? (e) => {
                    e.stopPropagation();
                    dragIndexRef.current = index;
                  }
                : undefined
            }
            onDragEnd={(e) => {
              e.stopPropagation();
              dragIndexRef.current = null;
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => {
              e.stopPropagation();
              if (
                dragIndexRef.current !== null &&
                dragIndexRef.current !== index
              ) {
                onReorderTabs(dragIndexRef.current, index);
                dragIndexRef.current = null;
              }
            }}
          >
            {tab.label}
            {tab.closeable && (
              <span
                className="ml-2 opacity-0 group-hover:opacity-100 hover:text-error transition-opacity text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(tab.id);
                }}
              >
                ×
              </span>
            )}
          </a>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {activeTab ? renderContent(activeTab) : null}
      </div>
    </div>
  );
}
