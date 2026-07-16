import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import MedusaPage from "./MedusaPage.tsx";
import HecatePage from "./HecatePage.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/medusa" element={<MedusaPage />} />
        <Route path="/hecate" element={<HecatePage />} />
        <Route path="/heacte" element={<HecatePage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
