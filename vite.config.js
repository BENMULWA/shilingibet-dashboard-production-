import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],

  server: {
    allowedHosts: ["dashboard.shilingibet.com"],
  },

  build: {
    chunkSizeWarningLimit: 1500, // increase warning limit
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          vendor: ["axios", "lodash"],
        },
      },
    },
  },
});

