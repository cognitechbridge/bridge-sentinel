import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true
  },
  optimizeDeps: {
    exclude: ['js-big-decimal']
  },
  envPrefix: ['VITE_', 'TAURI_']
});
