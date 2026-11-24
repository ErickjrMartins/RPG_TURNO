import { createPlazaMiddleware } from './server/plaza.mjs'
import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [{
    name: 'aurora-plaza',
    configureServer(server) { server.middlewares.use(createPlazaMiddleware()) },
    configurePreviewServer(server) { server.middlewares.use(createPlazaMiddleware()) },
  }],
  test: { include: ['tests/**/*.test.{ts,mjs}'] },
  build: {
    // Phaser is a separately loaded engine chunk. Keep a size warning above its current baseline.
    chunkSizeWarningLimit: 1250,
    ...(mode === 'portable' ? {
      outDir: 'work/portable-build',
      modulePreload: false,
      rolldownOptions: { output: { codeSplitting: false } },
    } : {}),
  },
}))
