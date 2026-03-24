import { Route, Routes } from "react-router-dom";
import { Home } from "./pages/Home";
import { Project } from "./pages/Project";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/project/:projectId" element={<Project />}>
        <Route path="chart/:chartId" element={<></>} />
        <Route path="data/:dataSourceId" element={<></>} />
        <Route path="spend" element={<></>} />
      </Route>
    </Routes>
  );
}

export default App;
