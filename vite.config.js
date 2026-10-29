import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

// All settings come from the .env file (see .env.example)
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const proxy = {};
  if (command === "serve" && !env.VITE_API_URL) {
    if (!env.VITE_PROXY_TARGET) {
      throw new Error("Set VITE_PROXY_TARGET (or VITE_API_URL) in the .env file — see .env.example");
    }
    proxy["/api"] = { target: env.VITE_PROXY_TARGET };
  }
  return { plugins: [react()], server: { proxy } };
});
