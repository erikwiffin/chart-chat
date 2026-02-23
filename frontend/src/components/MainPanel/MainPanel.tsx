import { useState } from "react";
import { MainPanelView, type Tab } from "./MainPanelView";

const TABS: Tab[] = [
  { id: "overview", label: "Overview", content: <p>Overview content goes here.</p> },
  { id: "charts", label: "Charts", content: <p>Charts go here.</p> },
];

export function MainPanel() {
  const [activeTab, setActiveTab] = useState(TABS[0].id);

  return (
    <MainPanelView tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
  );
}
