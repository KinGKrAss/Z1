import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import CouncilDashboard from "./CouncilDashboard";
import "./council-dashboard.css";

createRoot(document.getElementById("council-root")!).render(
  <StrictMode><CouncilDashboard /></StrictMode>,
);
