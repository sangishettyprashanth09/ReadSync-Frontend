import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Reader from "./pages/Reader";
import Dashboard from "./pages/Dashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/reader/:id" element={<Reader />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;