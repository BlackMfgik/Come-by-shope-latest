import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom", // віртуальний DOM для React
    globals: true, // describe/test/expect без імпорту
    setupFiles: ["./tests/setup.ts"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") }, // щоб @/components/ працювало
  },
});
