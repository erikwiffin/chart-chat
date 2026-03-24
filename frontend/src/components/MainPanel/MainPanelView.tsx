import { useRef, useState } from "react";
import type { ReactNode } from "react";
import type { AppTab } from "./tabs";

type Notification = { id: number; message: string };

type Props = {
  tabs: AppTab[];
  activeTabId: string;
  notifications: Notification[];
  onTabChange: (id: string) => void;
  onCloseTab: (id: string) => void;
  onReorderTabs: (fromIndex: number, toIndex: number) => void;
  renderContent: (tab: AppTab) => ReactNode;
};

export function MainPanelView({
  tabs,
  activeTabId,
  notifications,
  onTabChange,
  onCloseTab,
  onReorderTabs,
  renderContent,
}: Props) {
  const dragIndexRef = useRef<number | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const activeTab = tabs.find((t) => t.id === activeTabId);

  return (
    <div className="flex flex-col h-full">
      <div role="tablist" className="tabs tabs-lift px-4 pt-2">
        {tabs.map((tab, index) => (
          <a
            key={tab.id}
            role="tab"
            className={`tab group ${activeTabId === tab.id ? "tab-active" : ""} ${dragIndex === index ? "opacity-40" : ""} ${hoverIndex === index && dragIndex !== index ? "border-l-[3px] border-primary" : ""}`}
            onClick={() => onTabChange(tab.id)}
            draggable={tab.closeable}
            onDragStart={
              tab.closeable
                ? (e) => {
                    e.stopPropagation();
                    dragIndexRef.current = index;
                    setDragIndex(index);
                  }
                : undefined
            }
            onDragEnd={(e) => {
              e.stopPropagation();
              dragIndexRef.current = null;
              setDragIndex(null);
              setHoverIndex(null);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setHoverIndex(index);
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

      <div className="flex-1 overflow-y-auto p-6 -mt-px border-t border-base-300">
        {activeTab ? renderContent(activeTab) : null}
      </div>

      {notifications.length > 0 && (
        <div className="toast toast-top toast-end">
          {notifications.map((n) => (
            <div key={n.id} className="alert alert-success">
              <span>{n.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
