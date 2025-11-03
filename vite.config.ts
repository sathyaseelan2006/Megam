import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 5173,
        host: 'localhost',
        proxy: {
          // Proxy OpenAQ API requests to avoid CORS in development
          '/api/openaq': {
            target: 'https://api.openaq.org/v3',
            changeOrigin: true,
            rewrite: (path) => {
              // Extract the URL from query parameter
              const url = new URL(`http://localhost${path}`);
              const targetUrl = url.searchParams.get('url');
              if (targetUrl) {
                return new URL(targetUrl).pathname + new URL(targetUrl).search;
              }
              return path.replace(/^\/api\/openaq/, '');
            },
            configure: (proxy, options) => {
              proxy.on('proxyReq', (proxyReq, req, res) => {
                // Add the API key header
                proxyReq.setHeader('X-API-Key', env.VITE_OPENAQ_API_KEY || '');
              });
            },
          },
        },
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        sourcemap: false,
        minify: 'terser',
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true,
          },
        },
        rollupOptions: {
          output: {
            manualChunks: {
              'react-vendor': ['react', 'react-dom'],
              'globe': ['react-globe.gl'],
            },
          },
        },
      },
      optimizeDeps: {
        include: ['react', 'react-dom', 'react-globe.gl', '@google/genai'],
      },
    };
});
