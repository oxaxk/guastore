import { defineConfig } from 'vite';
import path from 'path';

// Local verification only. Production keeps its existing SWC configuration.
export default defineConfig({
  server: { host: '127.0.0.1', port: 8080, strictPort: true },
  preview: { host: '127.0.0.1', port: 4173, strictPort: true },
  esbuild: { jsx: 'automatic' },
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
});
