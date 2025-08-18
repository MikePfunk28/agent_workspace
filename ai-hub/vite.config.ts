import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig, searchForWorkspaceRoot } from "vite"
import sourceIdentifierPlugin from 'vite-plugin-source-info'
import dotenv from 'dotenv'
dotenv.config()

const isProd = process.env.BUILD_MODE === 'prod'
export default defineConfig({
  server: {
    fs: {
      allow: [searchForWorkspaceRoot(process.cwd())],
    },
  },
  plugins: [
    react(), 
    sourceIdentifierPlugin({
      enabled: !isProd,
      attributePrefix: 'data-matrix',
      includeProps: true,
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})

