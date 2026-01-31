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
  // Force pre-bundling of dependencies to avoid TDZ issues in production
  optimizeDeps: {
    include: ['framer-motion', 'react', 'react-dom', 'react-router-dom'],
  },
  build: {
    // Aggressive chunking to avoid TDZ issues
    rollupOptions: {
      output: {
        // Separate vendor dependencies into their own chunks
        manualChunks(id) {
          // Isolate framer-motion completely (must be first to avoid being caught by react check)
          if (id.includes('framer-motion')) {
            return 'vendor-framer-motion';
          }
          // Isolate lucide icons
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
          // Isolate tanstack (react-query)
          if (id.includes('node_modules/@tanstack')) {
            return 'vendor-tanstack';
          }
          // Combine React + charts to avoid circular dependency
          if (id.includes('node_modules/react') || 
              id.includes('node_modules/react-dom') || 
              id.includes('node_modules/react-router') ||
              id.includes('node_modules/scheduler') ||
              id.includes('node_modules/recharts') || 
              id.includes('node_modules/d3')) {
            return 'vendor-react';
          }
        },
      },
    },
  },
  // #endregion
})
