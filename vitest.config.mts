import path from "node:path";
import AutoImport from "unplugin-auto-import/vite";
import { defineConfig } from "vitest/config";

export default defineConfig({
  optimizeDeps: {
    exclude: ["oslo"],
  },
  plugins: [
    AutoImport({
      dts: false,
      dirs: ["./utils/*"],
    }),
  ],
  test: {
    alias: {
      "~": path.resolve(__dirname, "./"),
    },
    setupFiles: [],
    globals: true,
  },
});
