import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 5174,
        host: 'localhost',
        proxy: {
          // Proxy OpenAQ API requests to avoid CORS in development
          '/api/openaq': {
            target: 'https://api.openaq.org',
            changeOrigin: true,
            secure: false,
            rewrite: (path) => {
              // Extract the URL from query parameter and extract path
              try {
                const url = new URL(`http://localhost:5174${path}`);
                const targetUrl = url.searchParams.get('url');
                if (targetUrl) {
                  const parsed = new URL(targetUrl);
                  const rewritten = parsed.pathname + parsed.search;
                  console.log(`🔄 Proxy rewrite: ${path} -> ${rewritten}`);
                  return rewritten;
                }
              } catch (error) {
                console.error('❌ Proxy rewrite error:', error);
              }
              return path.replace(/^\/api\/openaq/, '');
            },
            configure: (proxy, options) => {
              proxy.on('error', (err, req, res) => {
                console.error('❌ Proxy error:', err);
              });
              proxy.on('proxyReq', (proxyReq, req, res) => {
                // Add the API key header for OpenAQ
                const apiKey = env.VITE_OPENAQ_API_KEY || '';
                console.log(`🔑 Adding OpenAQ API key: ${apiKey.substring(0, 10)}...`);
                proxyReq.setHeader('X-API-Key', apiKey);
              });
              proxy.on('proxyRes', (proxyRes, req, res) => {
                console.log(`✅ Proxy response: ${proxyRes.statusCode} for ${req.url}`);
              });
            },
          },

          // Proxy NASA POWER API requests to avoid CORS in development
          '/api/nasa': {
            target: 'https://power.larc.nasa.gov',
            changeOrigin: true,
            secure: false,
            rewrite: (path) => {
              // Extract the URL from query parameter and use its path+query
              try {
                const url = new URL(`http://localhost:5174${path}`);
                const targetUrl = url.searchParams.get('url');
                if (targetUrl) {
                  const parsed = new URL(targetUrl);
                  const rewritten = parsed.pathname + parsed.search;
                  console.log(`🔄 NASA proxy rewrite: ${path} -> ${rewritten}`);
                  return rewritten;
                }
              } catch (error) {
                console.error('❌ NASA proxy rewrite error:', error);
              }
              return path.replace(/^\/api\/nasa/, '');
            },
            configure: (proxy) => {
              proxy.on('error', (err) => {
                console.error('❌ NASA proxy error:', err);
              });
              proxy.on('proxyRes', (proxyRes, req) => {
                console.log(`✅ NASA proxy response: ${proxyRes.statusCode} for ${req.url}`);
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
