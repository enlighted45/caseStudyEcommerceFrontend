import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// Local development stays on 5173 because the unchanged backend allows this origin.
export default defineConfig({
  plugins: [react()],
  server: {
    host: "localhost",
    port: 5173,
    strictPort: true,
    open: "http://localhost:5173",
  },
  preview: { host: "0.0.0.0", port: 4173 },
});
