import type { ReactNode } from "react";

export type Tab = {
  id: string;
  label: string;
  content: ReactNode;
};

type Props = {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (id: string) => void;
};

export function MainPanelView({ tabs, activeTab, onTabChange }: Props) {
  const active = tabs.find((t) => t.id === activeTab);

  return (
    <div className="flex flex-col h-full">
      <div role="tablist" className="tabs tabs-lift px-4 pt-2">
        {tabs.map((tab) => (
          <a
            key={tab.id}
            role="tab"
            className={`tab ${activeTab === tab.id ? "tab-active" : ""}`}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </a>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6">{active?.content}</div>
    </div>
  );
}
