import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["tests/**/*.test.js"],
    coverage: {
      provider: "v8",
      include: ["lib/utils/**"],
      exclude: [
        // React component factory — ต้องใช้ @testing-library/react จึงจะทดสอบได้
        // hook + JSX ไม่สามารถ run ใน node environment ได้
        "lib/utils/createResourceContext.js",
      ],
      reporter: ["text", "html"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "."),
    },
  },
});
