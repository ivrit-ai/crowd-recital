import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import fs from "fs";

const sslKeyFile = path.join(__dirname, "../cert/key.pem");
const sslCertFile = path.join(__dirname, "../cert/cert.pem");

const keyAndCertFilesExists =
  fs.existsSync(sslKeyFile) && fs.existsSync(sslCertFile);

if (!keyAndCertFilesExists) {
  console.warn(
    "SSL key and cert files not found. Local Dev server will not server over HTTPS.",
  );
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
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
    },
  },
});
