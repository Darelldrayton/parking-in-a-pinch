import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const isDev = command === 'serve'
  
  return {
    plugins: [react()],
    
    // Build configuration
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false,
      minify: 'terser',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            mui: ['@mui/material', '@mui/icons-material'],
            router: ['react-router-dom'],
          }
        }
      }
    },
    
    // Base URL for production (adjust if hosting in subdirectory)
    base: isDev ? '/' : '/',
    
    // Development server configuration
    server: {
      port: 3008,
      host: 'localhost',
      strictPort: false,
      open: false,
      hmr: true,
      watch: {
        usePolling: true,
        interval: 1000,
      },
      proxy: {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
          secure: false,
        }
      }
    },
    
    // Preview server configuration
    preview: {
      port: 3008,
      host: '0.0.0.0'
    },
    
    // Optimization
    optimizeDeps: {
      exclude: ['fsevents']
    },
    
    // Environment variables
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    }
  }
})
