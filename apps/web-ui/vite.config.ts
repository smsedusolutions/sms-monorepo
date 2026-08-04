import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: [
      "react",
      "react-dom",
      "react-router",
      "react-router-dom",
      "@mui/material",
      "@mui/system",
      "@mui/icons-material",
      "@mui/x-date-pickers",
      "@emotion/react",
      "@emotion/styled",
      "date-fns",
    ],
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router",
      "react-router-dom",
      "@mui/material",
      "@mui/system",
      "@mui/icons-material",
      "@mui/x-date-pickers",
      "@emotion/react",
      "@emotion/styled",
      "date-fns",
      "zustand",
      "zustand/middleware",
    ],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (
              id.includes("react-router") ||
              id.includes("react-dom") ||
              id.includes("/react/")
            ) {
              return "vendor-react";
            }
            if (id.includes("@mui") || id.includes("@emotion")) {
              return "vendor-mui";
            }
            if (id.includes("react-google-charts")) {
              return "vendor-charts";
            }
            if (
              id.includes("date-fns") ||
              id.includes("axios") ||
              id.includes("zustand") ||
              id.includes("exceljs")
            ) {
              return "vendor-utils";
            }
          }
        },
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: false,
    // Inline framer-motion and testing-library through Vite's resolver.
    // @emotion/styled and @emotion/react are also aliased below to ensure
    // they resolve from apps/web-ui even if hoisted packages look for them.
    server: {
      deps: {
        inline: [
          /@testing-library\//,
          /framer-motion/,
        ],
      },
    },
    // Point react imports at the monorepo-root node_modules (react was
    // hoisted there when we installed it as a root devDependency)
    alias: [
      {
        find: /^react\/jsx-dev-runtime$/,
        replacement: path.resolve(__dirname, "../../node_modules/react/jsx-dev-runtime"),
      },
      {
        find: /^react\/jsx-runtime$/,
        replacement: path.resolve(__dirname, "../../node_modules/react/jsx-runtime"),
      },
      {
        find: /^react-dom\/client$/,
        replacement: path.resolve(__dirname, "../../node_modules/react-dom/client"),
      },
      {
        find: /^react-dom$/,
        replacement: path.resolve(__dirname, "../../node_modules/react-dom"),
      },
      {
        find: /^react$/,
        replacement: path.resolve(__dirname, "../../node_modules/react"),
      },
      {
        find: "@",
        replacement: path.resolve(__dirname, "./src"),
      },
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/components/**"],
      exclude: [
        // Complex modal forms — require full router + API mocking
        "src/components/Dialogs/**",
        // PDF rendering — requires headless print environment
        "src/components/PDFLayouts/**",
        // Browser-native file/image upload APIs unavailable in jsdom
        "src/components/FileUpload/**",
        "src/components/ImageUpload/**",
        // External map library (1 715 lines, canvas/WebGL)
        "src/components/ui/**",
        // Transport management — complex business + router deps
        "src/components/Transport/**",
        // Excel utilities — xlsx binary processing
        "src/components/ExcelBulk/**",
        "src/components/ExcelExport/**",
        // Push notification bell — WebSocket + service-worker deps
        "src/components/NotificationBell/**",
        // Separate Table module (covered by shared table tests)
        "src/components/Table/**",
        // Location picker — external Leaflet/map API
        "src/components/LocationPicker.tsx",
        // Dashboard chart cards
        "src/components/Dashboard/**",
        // Tree child-selector — complex recursive component
        "src/components/ChildSelector/**",
        // Thin tooltip wrapper (no testable logic)
        "src/components/Common/**",
      ],
    },
  },
});
