import path from "path";
import fs from "fs";
import { defineConfig, PluginOption } from "vite";
import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";

const sslKeyFile = path.join(__dirname, "../cert/key.pem");
const sslCertFile = path.join(__dirname, "../cert/cert.pem");

const keyAndCertFilesExists =
  fs.existsSync(sslKeyFile) && fs.existsSync(sslCertFile);

if (!keyAndCertFilesExists) {
  console.warn(
    "SSL key and cert files not found. Local Dev server will not serve over HTTPS.",
  );
}

const injectEnvConfigScriptPlugin: () => PluginOption = () => {
  return {
    name: "build-html",
    transformIndexHtml: (html) => {
      return {
        html,
        tags: [
          {
            tag: "link",
            attrs: {
              rel: "preload",
              as: "script",
              href: "/env/config.js",
            },
            injectTo: "head-prepend",
          },
          {
            tag: "script",
            attrs: {
              src: "/env/config.js",
            },
            injectTo: "head",
          },
        ],
      };
    },
  };
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [TanStackRouterVite(), react(), injectEnvConfigScriptPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    https: keyAndCertFilesExists
      ? {
          key: fs.readFileSync(path.join(__dirname, "../cert/key.pem")),
          cert: fs.readFileSync(path.join(__dirname, "../cert/cert.pem")),
        }
      : undefined,
    proxy: {
      "/api": {
        target: "https://127.0.0.1:8000",
        changeOrigin: true,
        secure: false,
      },
      "/env": {
        target: "https://127.0.0.1:8000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
