import React from "react";
import ReactDOM from "react-dom/client";
import { AGUIProvider, createLocalSessionStorage } from "react-agui-core";
import App from "./App";
import "./index.css";

// 开发时 Vite 会把 /agui 代理到 example-server (3001)，所以这里用相对路径
const aguiUrl = import.meta.env.DEV
  ? "/agui"
  : (import.meta.env.VITE_AGUI_URL ?? "http://localhost:3001");

const storage = createLocalSessionStorage({ key: "example_agui_sessions" });

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AGUIProvider url={aguiUrl} storage={storage} debug={import.meta.env.DEV}>
      <App />
    </AGUIProvider>
  </React.StrictMode>,
);
