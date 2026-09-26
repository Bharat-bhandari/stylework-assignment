import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      // The API serves the brief's paths at the root, so the /api prefix is stripped here
      // exactly as nginx strips it in the deployed stack.
      proxy: {
        '/api': {
          target: env.API_PROXY_TARGET ?? 'http://localhost:4000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
  };
});
