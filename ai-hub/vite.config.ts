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
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Radix UI components (largest portion)
          'radix-ui': [
            '@radix-ui/react-accordion',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-avatar',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-popover',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
            '@radix-ui/react-tooltip'
          ],
          // Chart library
          'charts': ['recharts'],
          // Supabase
          'supabase': ['@supabase/supabase-js'],
          // Icons
          'icons': ['lucide-react'],
          // Router
          'router': ['react-router-dom'],
          // Forms
          'forms': ['react-hook-form', '@hookform/resolvers', 'zod']
        }
      }
    },
    // Reduce chunk size warning limit
    chunkSizeWarningLimit: 600
  }
})

