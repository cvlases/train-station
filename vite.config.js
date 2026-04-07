import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  // Tell Vite to treat .glb files as static assets that can be imported with ?url
  assetsInclude: ['**/*.glb'],
  build: {
    outDir: 'dist',
  },
});
