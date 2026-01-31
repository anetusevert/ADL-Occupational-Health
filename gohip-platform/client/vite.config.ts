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
  // Force pre-bundling of key dependencies to avoid TDZ issues in production
  optimizeDeps: {
    include: ['framer-motion', 'react', 'react-dom', 'react-router-dom'],
  },
  build: {
    // Use consistent chunk naming for better caching
    rollupOptions: {
      output: {
        // Separate vendor libraries into their own chunks to avoid TDZ issues
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'router': ['react-router-dom'],
          'framer-motion': ['framer-motion'],
          'query': ['@tanstack/react-query'],
        },
      },
    },
  },
  // #endregion
})
