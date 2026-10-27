import { createRoot } from "react-dom/client";
import App from "./app/App";
import "./shared/theme.css";
import "leaflet/dist/leaflet.css";
import "./shared/app.css";
const host = document.getElementById("root");
if (host) createRoot(host).render(<App />);
