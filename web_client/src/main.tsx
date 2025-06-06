import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { VERSION } from './version';

import "./i18n";

import { EnvConfig } from "@/env/config";
import App from "./App";

console.log(
  "%cעברית.ai",
  "color: black; background-color: white; font-size: 2rem; padding: 16px 4px; border-radius: 10px;",
  `\n-- Crowd Recital Client ${VERSION}`,
  `\n-- Server Version ${EnvConfig.get("version")}`,
);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
