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
    exclude: [], // Don't exclude React
    esbuildOptions: {
      target: 'es2020',
    },
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
    // Ensure proper module format
    target: 'esnext',
    minify: 'esbuild',
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
    rollupOptions: {
      output: {
        // Disable automatic vendor chunking - only manually chunk specific large deps
        // This ensures React stays in entry bundle
        manualChunks: (id) => {
          // Early exit for React - never chunk it
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return; // Keep React in entry bundle
          }
          
          // Only process node_modules
          if (!id.includes('node_modules')) {
            return; // Source files stay in entry
          }
          
          // Extract module name
          const match = id.match(/node_modules[\/\\]([^\/\\]+)/);
          if (!match) return;
          
          const moduleName = match[1];
          
          // NEVER chunk React
          if (moduleName === 'react' || moduleName === 'react-dom') {
            return; // Keep in entry
          }
          
          // Only chunk these specific large libraries
          // All other deps (including React) stay in entry
          if (moduleName === 'react-router-dom') return 'router';
          if (moduleName.startsWith('@radix-ui')) return 'radix';
          if (moduleName === 'recharts') return 'charts';
          if (moduleName === 'mapbox-gl') return 'mapbox';
          if (moduleName === 'socket.io-client') return 'socket';
          
          // Everything else (including React) stays in entry bundle
          return;
        },
      },
    },
  },
}));
