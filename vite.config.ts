import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";


// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false, // Disable error overlay to reduce memory usage
    },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'html2canvas', 'qrcode.react', 'mapbox-gl'],
    esbuildOptions: {
      target: 'es2020',
    },
    // Force React to be pre-bundled and deduplicated
    force: true,
  },
  define: {
    'process.env': {},
  },
  esbuild: {
    target: 'es2020',
    logLimit: 1000, // Limit log output to prevent memory issues
  },
  build: {
    chunkSizeWarningLimit: 1000,
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          // More aggressive chunking to reduce memory pressure
          if (id.includes('node_modules')) {
            const moduleName = id.split('node_modules/')[1].split('/')[0];
            
            // CRITICAL FIX: Do NOT chunk React/React-DOM separately
            // Returning undefined keeps React in the entry bundle, ensuring it's always available
            // This prevents "Cannot read properties of undefined (reading 'useSyncExternalStore')" errors
            if (moduleName === 'react' || moduleName === 'react-dom') {
              return undefined; // Keep React in entry bundle
            }
            if (moduleName === 'react-router-dom') {
              return 'router-vendor';
            }
            if (moduleName.startsWith('@radix-ui')) {
              return 'radix-vendor';
            }
            if (moduleName === 'recharts') {
              return 'charts-vendor';
            }
            if (moduleName === 'mapbox-gl') {
              return 'mapbox-vendor';
            }
            if (moduleName === 'socket.io-client') {
              return 'socket-vendor';
            }
            
            // Group other node_modules
            return 'vendor';
          }
        },
        // Ensure proper chunk ordering - vendor chunk loads first
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
  },
}));
