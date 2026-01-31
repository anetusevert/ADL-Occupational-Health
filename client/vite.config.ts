import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  },
  // #region agent log - TDZ fix configuration
  // Force pre-bundling of framer-motion to avoid TDZ issues in production
  optimizeDeps: {
    include: ['framer-motion'],
  },
  build: {
    // Use consistent chunk naming for better caching
    rollupOptions: {
      output: {
        // Separate framer-motion into its own chunk to avoid TDZ issues
        manualChunks: {
          'framer-motion': ['framer-motion'],
        },
      },
    },
  },
  // #endregion
})
