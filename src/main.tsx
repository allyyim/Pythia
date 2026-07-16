import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import MedusaPage from "./MedusaPage.tsx";
import NyxPage from "./NyxPage.tsx";
import AriadnePage from "./AriadnePage.tsx";
import JanusPage from "./JanusPage.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/medusa" element={<MedusaPage />} />
        <Route path="/nyx" element={<NyxPage />} />
        <Route path="/ariadne" element={<AriadnePage />} />
        <Route path="/cassandra" element={<AriadnePage />} />
        <Route path="/janus" element={<JanusPage />} />
        <Route path="/hecate" element={<NyxPage />} />
        <Route path="/heacte" element={<NyxPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
