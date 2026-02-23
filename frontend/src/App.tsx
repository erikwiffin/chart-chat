import { useState } from "react";
import { Home } from "./pages/Home";
import { Project } from "./pages/Project";

type AppPage =
  | { view: "home" }
  | { view: "project"; projectId: string; projectName: string };

function App() {
  const [page, setPage] = useState<AppPage>({ view: "home" });

  if (page.view === "project") {
    return (
      <Project
        projectId={page.projectId}
        projectName={page.projectName}
        onHome={() => setPage({ view: "home" })}
      />
    );
  }

  return (
    <Home
      onProjectOpen={(id, name) => setPage({ view: "project", projectId: id, projectName: name })}
    />
  );
}

export default App;
